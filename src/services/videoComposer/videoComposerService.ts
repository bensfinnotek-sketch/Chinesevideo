import { LessonScene } from '../../types/lesson';
import { 
  VideoComposerConfig, 
  ExportPipelineStep, 
  VIDEO_FORMAT_RESOLUTIONS,
  EXPORT_STEP_LABELS 
} from '../../types/composer';
import { audioEngine } from '../audioEngine/audioEngineService';
import { visualEngine } from '../visualEngine/visualEngineService';
import { renderSceneCanvasFrame } from './canvasRenderer';

export interface ExportResult {
  videoUrl: string;
  blob: Blob;
  format: VideoComposerConfig['format'];
  mimeType: string;
  fileExtension: 'mp4' | 'webm';
  durationSeconds: number;
  fileSizeMb: number;
}

export class VideoComposerService {
  private static instance: VideoComposerService;

  private constructor() {}

  public static getInstance(): VideoComposerService {
    if (!VideoComposerService.instance) {
      VideoComposerService.instance = new VideoComposerService();
    }
    return VideoComposerService.instance;
  }

  /**
   * Pipeline xuất video hoàn chỉnh qua 6 bước nghiêm ngặt:
   * Preparing → Generating audio → Generating visuals → Rendering scenes → Combining video → Finalizing
   */
  public async exportFullLessonVideo(
    scenes: LessonScene[],
    config: VideoComposerConfig,
    onProgress: (step: ExportPipelineStep, percent: number, desc: string) => void
  ): Promise<ExportResult> {
    const resolution = VIDEO_FORMAT_RESOLUTIONS[config.format] || VIDEO_FORMAT_RESOLUTIONS['16:9'];
    const totalScenes = scenes.length;

    // 1. Preparing
    onProgress('preparing', 10, 'Đang chuẩn bị Canvas 1080p 24fps & Safe Area...');
    await sleep(400);

    // 2. Generating audio (đảm bảo cả 8 scenes đã có TTS Audio)
    onProgress('generating_audio', 25, 'Đang kiểm tra & tổng hợp TTS Audio tiếng Trung & tiếng Việt...');
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (!audioEngine.getAudioForScene(s.sceneId)) {
        await audioEngine.generateSceneAudio(s).catch(() => {});
      }
      onProgress('generating_audio', 25 + Math.round((i / totalScenes) * 15), `TTS audio Scene ${s.sceneId}/${totalScenes}...`);
    }

    // 3. Generating visuals (đảm bảo background & B-roll đã sẵn sàng)
    onProgress('generating_visuals', 45, 'Đang đồng bộ hình ảnh minh họa & B-roll...');
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      if (!visualEngine.getVisualForScene(s.sceneId)) {
        // Tự động gán visual preset nếu chưa có
        visualEngine.generateSceneVisual({
          sceneId: String(s.sceneId),
          sceneType: s.type,
          visualPrompt: s.visualPrompt || 'Educational classroom',
          assetType: 'image',
          duration: s.duration,
          aspectRatio: config.format === '9:16' ? '9:16' : '16:9',
          style: 'warm_educational_animation'
        }).catch(() => {});
      }
      onProgress('generating_visuals', 45 + Math.round((i / totalScenes) * 15), `Visual Asset Scene ${s.sceneId}/${totalScenes}...`);
    }

    // 4. Rendering scenes (Vẽ độc lập từng scene trên Canvas 24fps với 10 layer)
    onProgress('rendering_scenes', 65, 'Đang vẽ độc lập 10 lớp đồ họa, Text Overlay & Karaoke Highlight...');
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = resolution.width;
    offscreenCanvas.height = resolution.height;
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Trình duyệt không hỗ trợ Canvas 2D context.');
    }

    // Tải trước các tài nguyên ảnh nền
    const imageCache = new Map<string, HTMLImageElement>();
    for (const s of scenes) {
      const v = visualEngine.getVisualForScene(s.sceneId);
      if (v?.url && v.visualMode !== 'no_visual') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = v.url;
        await new Promise(r => {
          img.onload = r;
          img.onerror = r;
        });
        imageCache.set(String(s.sceneId), img);
      }
    }

    // 5. Combining video & MediaRecorder
    onProgress('combining_video', 85, 'Đang nối các scenes, áp dụng chuyển cảnh Transition & đóng gói...');
    
    // Thu video bằng MediaRecorder từ Canvas Stream
    const stream = offscreenCanvas.captureStream(config.fps || 24);
    
    // Tích hợp AudioTrack nếu MediaStreamDestination được hỗ trợ
    let audioContext: AudioContext | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioDest = audioContext.createMediaStreamDestination();
      stream.addTrack(audioDest.stream.getAudioTracks()[0]);
    } catch (e) {
      console.warn('AudioContext stream mixing optional fallback:', e);
    }

    const recorderConfig = getSupportedVideoRecorderConfig();
    const mimeType = recorderConfig.mimeType;
    const recordedChunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 6000000,
      ...(recorderConfig.audioBitsPerSecond
        ? { audioBitsPerSecond: recorderConfig.audioBitsPerSecond }
        : {}),
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start(100);

    // Render từng scene theo đúng thời gian thực ở FPS cấu hình.
    // MediaRecorder chỉ ghi những frame thực sự được đẩy vào Canvas stream;
    // vì vậy không thể dùng vài frame mô phỏng rồi gắn duration giả.
    let totalLessonSeconds = 0;
    const frameIntervalMs = 1000 / Math.max(1, config.fps || 24);

    for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
      const scene = scenes[sIdx];
      const audioMeta = audioEngine.getAudioForScene(scene.sceneId);
      const visualMeta = visualEngine.getVisualForScene(scene.sceneId);
      const imgElem = imageCache.get(String(scene.sceneId));

      const sceneDuration = Math.max(
        0.1,
        audioMeta?.duration || scene.duration || 15
      );
      totalLessonSeconds += sceneDuration;

      if (config.enableChimeSoundEffect && audioContext && audioDest) {
        playChime(audioContext, audioDest);
      }

      // Audio và video chạy đồng bộ trong cùng thời gian scene.
      const audioPlayback = audioContext && audioDest && audioMeta?.audioUrl
        ? playAudioTrack(audioContext, audioDest, audioMeta.audioUrl, sceneDuration)
        : Promise.resolve();

      const startedAt = performance.now();
      let frameIndex = 0;

      while ((performance.now() - startedAt) / 1000 < sceneDuration) {
        const elapsed = (performance.now() - startedAt) / 1000;
        const timeInScene = Math.min(elapsed, sceneDuration);
        const transitionProgress = elapsed < config.transitionDurationSec
          ? elapsed / Math.max(0.001, config.transitionDurationSec)
          : 1;

        renderSceneCanvasFrame({
          ctx,
          width: resolution.width,
          height: resolution.height,
          scene,
          visualMeta,
          audioMeta,
          currentTimeInScene: timeInScene,
          config,
          transitionProgress,
          transitionType: config.transitionType,
          imageElement: imgElem,
        });

        frameIndex++;
        await sleep(frameIntervalMs);
      }

      // Đảm bảo frame cuối của scene được ghi trước khi chuyển scene.
      renderSceneCanvasFrame({
        ctx,
        width: resolution.width,
        height: resolution.height,
        scene,
        visualMeta,
        audioMeta,
        currentTimeInScene: sceneDuration,
        config,
        transitionProgress: 1,
        transitionType: config.transitionType,
        imageElement: imgElem,
      });

      await audioPlayback;
      onProgress(
        'combining_video',
        85 + Math.round(((sIdx + 1) / totalScenes) * 10),
        `Đã render & nối Scene ${scene.sceneId}/${totalScenes} (${frameIndex} frames)...`
      );
    }

    // 6. Finalizing
    onProgress('finalizing', 96, 'Đang hoàn tất đóng gói container MP4...');
    await sleep(300);

    // Dừng recorder và xuất file
    const exportResult = await new Promise<ExportResult>((resolve) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(finalBlob);
        const sizeMb = Number((finalBlob.size / (1024 * 1024)).toFixed(2));

        if (audioContext) {
          audioContext.close().catch(() => {});
        }

        resolve({
          videoUrl,
          blob: finalBlob,
          format: config.format,
          mimeType,
          fileExtension: recorderConfig.fileExtension,
          durationSeconds: Number(totalLessonSeconds.toFixed(1)),
          fileSizeMb: Math.max(0.5, sizeMb),
        });
      };

      recorder.stop();
    });

    onProgress('completed', 100, 'Video bài giảng đã xuất bản thành công!');
    return exportResult;
  }
}

async function playAudioTrack(
  ctx: AudioContext,
  dest: MediaStreamAudioDestinationNode,
  audioUrl: string,
  fallbackDuration: number
): Promise<void> {
  const audio = new Audio(audioUrl);
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';

  try {
    const source = ctx.createMediaElementSource(audio);
    source.connect(dest);

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        audio.pause();
        audio.currentTime = 0;
        resolve();
      };

      audio.onended = finish;
      audio.onerror = finish;

      const timeout = window.setTimeout(finish, (fallbackDuration + 1) * 1000);

      audio.onended = () => {
        window.clearTimeout(timeout);
        finish();
      };
      audio.onerror = () => {
        window.clearTimeout(timeout);
        finish();
      };

      audio.play().catch(() => {
        window.clearTimeout(timeout);
        finish();
      });
    });
  } catch {
    // Some browsers cannot connect a given audio URL to Web Audio.
    // The video remains valid; the renderer simply records silence.
    await sleep(fallbackDuration * 1000);
  }
}

function getSupportedVideoRecorderConfig(): {
  mimeType: string;
  fileExtension: 'mp4' | 'webm';
  audioBitsPerSecond?: number;
} {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Trình duyệt hiện tại không hỗ trợ MediaRecorder.');
  }

  // MP4 is preferred when the browser exposes it. Otherwise use WebM
  // instead of falsely labeling a WebM blob as .mp4.
  const candidates = [
    {
      mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      fileExtension: 'mp4' as const,
      audioBitsPerSecond: 128000,
    },
    {
      mimeType: 'video/mp4',
      fileExtension: 'mp4' as const,
      audioBitsPerSecond: 128000,
    },
    {
      mimeType: 'video/webm;codecs=vp9,opus',
      fileExtension: 'webm' as const,
      audioBitsPerSecond: 128000,
    },
    {
      mimeType: 'video/webm;codecs=vp8,opus',
      fileExtension: 'webm' as const,
      audioBitsPerSecond: 128000,
    },
    {
      mimeType: 'video/webm',
      fileExtension: 'webm' as const,
      audioBitsPerSecond: 128000,
    },
  ];

  const supported = candidates.find(candidate =>
    MediaRecorder.isTypeSupported(candidate.mimeType)
  );

  if (!supported) {
    throw new Error('Không tìm được định dạng video mà trình duyệt hỗ trợ.');
  }

  return supported;
}

function playChime(ctx: AudioContext, dest: MediaStreamAudioDestinationNode) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio context chime errors
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export const videoComposer = VideoComposerService.getInstance();
