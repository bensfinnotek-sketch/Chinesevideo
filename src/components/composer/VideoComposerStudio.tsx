import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Sparkles, 
  Film, 
  Volume2, 
  Settings2, 
  CheckCircle2, 
  Edit3, 
  RefreshCw, 
  Layers, 
  Clock, 
  Sliders, 
  Smartphone, 
  Monitor, 
  Square, 
  Check, 
  AlertCircle,
  FileVideo,
  PlusCircle,
  ArrowRight,
  BookOpen,
  VolumeX,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { LessonScene, LessonContent } from '../../types/lesson';
import { 
  VideoFormat, 
  VideoComposerConfig, 
  ExportPipelineStep, 
  EXPORT_STEP_LABELS,
  VIDEO_FORMAT_RESOLUTIONS,
  TransitionType 
} from '../../types/composer';
import { AudioSegment, TTSSpeedMode } from '../../services/audioEngine/types';
import { audioEngine } from '../../services/audioEngine/audioEngineService';
import { visualEngine } from '../../services/visualEngine/visualEngineService';
import { AVAILABLE_VOICES } from '../../services/audioEngine/voicePresets';
import { renderSceneCanvasFrame } from '../../services/videoComposer/canvasRenderer';
import { videoComposer, ExportResult } from '../../services/videoComposer/videoComposerService';
import { SceneInspector } from './SceneInspector';

interface VideoComposerStudioProps {
  lesson: LessonContent;
  scenes: LessonScene[];
  onUpdateScenes: (updatedScenes: LessonScene[]) => void;
  onNavigateToTab: (tab: 'import' | 'parser' | 'lesson' | 'audio' | 'visual' | 'config' | 'preview') => void;
}

export const VideoComposerStudio: React.FC<VideoComposerStudioProps> = ({
  lesson,
  scenes,
  onUpdateScenes,
  onNavigateToTab,
}) => {
  // Config
  const [composerConfig, setComposerConfig] = useState<VideoComposerConfig>({
    format: '16:9',
    fps: 24,
    showSafeAreaGuide: true,
    enableTransitions: true,
    transitionType: 'crossfade',
    transitionDurationSec: 0.5,
    enableChimeSoundEffect: true,
    themeStyle: 'warm_paper',
  });

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [inspectorTab, setInspectorTab] = useState<'content' | 'audio' | 'visual' | 'export'>('content');
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  // Inline scene editing state
  const [isEditingScene, setIsEditingScene] = useState(false);
  const [editedChinese, setEditedChinese] = useState(currentScene?.chineseText || '');
  const [editedPinyin, setEditedPinyin] = useState(currentScene?.pinyin || '');
  const [editedVietnamese, setEditedVietnamese] = useState(currentScene?.vietnamese || '');
  const [editedExplanation, setEditedExplanation] = useState(currentScene?.teacherExplanation || '');
  const [editedDuration, setEditedDuration] = useState(currentScene?.duration || 15);
  const [editedVoice, setEditedVoice] = useState(currentScene?.voice || 'Kore');
  const [editedSpeed, setEditedSpeed] = useState<TTSSpeedMode>('normal');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preview playback state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [activeAudioSegment, setActiveAudioSegment] = useState<AudioSegment | null>(null);

  // Export pipeline modal & progress
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStep, setExportStep] = useState<ExportPipelineStep>('idle');
  const [exportPercent, setExportPercent] = useState(0);
  const [exportDesc, setExportDesc] = useState('');
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  // Canvas preview ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioControllerRef = useRef<{ stop: () => void } | null>(null);

  // Sync edits when active scene changes
  useEffect(() => {
    if (currentScene) {
      setEditedChinese(currentScene.chineseText || '');
      setEditedPinyin(currentScene.pinyin || '');
      setEditedVietnamese(currentScene.vietnamese || '');
      setEditedExplanation(currentScene.teacherExplanation || '');
      setEditedDuration(currentScene.duration || 15);
      setEditedVoice(currentScene.voice || 'Kore');
      setIsEditingScene(false);
      setPreviewCurrentTime(0);
      setActiveAudioSegment(null);
      drawCurrentCanvasFrame(0);
    }
  }, [activeSceneIndex, currentScene]);

  // Vẽ Canvas Frame bất kỳ khi nào time, scene hoặc config thay đổi
  const drawCurrentCanvasFrame = (timeInSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentScene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const res = VIDEO_FORMAT_RESOLUTIONS[composerConfig.format];
    canvas.width = res.width;
    canvas.height = res.height;

    const audioMeta = audioEngine.getAudioForScene(currentScene.sceneId);
    const visualMeta = visualEngine.getVisualForScene(currentScene.sceneId);

    // Lấy ảnh nền nếu có
    let imgElem: HTMLImageElement | null = null;
    if (visualMeta?.url && visualMeta.visualMode !== 'no_visual') {
      imgElem = new Image();
      imgElem.src = visualMeta.url;
    }

    renderSceneCanvasFrame({
      ctx,
      width: res.width,
      height: res.height,
      scene: currentScene,
      visualMeta,
      audioMeta,
      currentTimeInScene: timeInSec,
      config: composerConfig,
      transitionProgress: timeInSec < 0.5 ? timeInSec / 0.5 : 1,
      transitionType: composerConfig.transitionType,
      imageElement: imgElem,
    });
  };

  // Vòng lặp phát thử Scene
  useEffect(() => {
    if (isPlayingPreview) {
      audioControllerRef.current = audioEngine.playSceneAudio(
        currentScene,
        (time, segment) => {
          setPreviewCurrentTime(time);
          setActiveAudioSegment(segment);
          drawCurrentCanvasFrame(time);
        },
        () => {
          setIsPlayingPreview(false);
          setPreviewCurrentTime(0);
          setActiveAudioSegment(null);
          drawCurrentCanvasFrame(0);
        }
      );
    } else {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
    }

    return () => {
      if (audioControllerRef.current) {
        audioControllerRef.current.stop();
      }
    };
  }, [isPlayingPreview, activeSceneIndex]);

  // Lưu chỉnh sửa Scene
  const handleSaveSceneEdits = () => {
    const updated = [...scenes];
    updated[activeSceneIndex] = {
      ...currentScene,
      chineseText: editedChinese,
      pinyin: editedPinyin,
      vietnamese: editedVietnamese,
      teacherExplanation: editedExplanation,
      duration: editedDuration,
      voice: editedVoice,
    };
    onUpdateScenes(updated);
    setIsEditingScene(false);
    drawCurrentCanvasFrame(previewCurrentTime);
  };

  // 1. Regenerate Scene
  const handleRegenerateScene = async () => {
    const updated = [...scenes];
    const s = { ...currentScene };
    if (s.type === 'dialogue') {
      s.chineseText = `A: 考试快到了，你复习得怎么样？\nB: 我有点紧张，但每天都认真复习！\nA: 加油，相信自己一定能考好！\nB: 谢谢你的鼓励！`;
      s.pinyin = `A: Kǎoshì kuài dào le, nǐ fùxí de zěnmeyàng?\nB: Wǒ yǒudiǎn jǐnzhāng, dàn měitiān dōu rènzhēn fùxí!\nA: Jiāyóu, xiāngxìn zìjǐ yīdìng néng kǎohǎo!\nB: Xièxie nǐ de gǔlì!`;
      s.vietnamese = `A: Kỳ thi sắp tới rồi, bạn ôn tập thế nào rồi?\nB: Mình hơi lo lắng, nhưng ngày nào cũng chăm chỉ ôn tập!\nA: Cố lên nhé, tin tưởng bản thân nhất định sẽ thi tốt!\nB: Cảm ơn sự khích lệ của bạn!`;
      s.teacherExplanation = `Trong đoạn này, chú ý mẫu câu hỏi thăm "复习得怎么样" và lời động viên "相信自己一定能考好" rất phổ biến trong giao tiếp trường học tiếng Trung!`;
    } else if (s.type === 'intro') {
      s.chineseText = `欢迎来到中文精品微课！\n今天我们一起轻松学中文。`;
      s.pinyin = `Huānyíng lái dào zhōngwén jīngpǐn wēikè!\nJīntiān wǒmen yīqǐ qīngsōng xué zhōngwén.`;
      s.vietnamese = `Chào mừng các bạn đến với bài học tiếng Trung chất lượng cao!\nHôm nay chúng ta sẽ cùng học tiếng Trung thật nhẹ nhàng và hiệu quả.`;
      s.teacherExplanation = `Chào các bạn học viên! Bài giảng hôm nay được xây dựng trực quan theo từng bước giúp các bạn ghi nhớ sâu chữ Hán, phát âm chuẩn thanh điệu và tự tin giao tiếp.`;
    } else {
      s.teacherExplanation = `${s.teacherExplanation || ''} (Đã làm mới: tối ưu hóa mẹo ghi nhớ chữ Hán và liên hệ ngữ cảnh thực tế).`;
    }
    updated[activeSceneIndex] = s;
    onUpdateScenes(updated);
    setEditedChinese(s.chineseText);
    setEditedPinyin(s.pinyin);
    setEditedVietnamese(s.vietnamese);
    setEditedExplanation(s.teacherExplanation);
    showToast(`Đã làm mới nội dung Scene ${currentScene.sceneId}!`);
    setTimeout(() => drawCurrentCanvasFrame(previewCurrentTime), 50);
  };

  // 2. Regenerate Audio
  const handleRegenerateAudio = async () => {
    showToast(`Đang tái tạo Audio cho Scene ${currentScene.sceneId}...`);
    try {
      await audioEngine.generateSceneAudio(currentScene);
      showToast(`Đã tái tạo xong Audio cho Scene ${currentScene.sceneId}!`);
      drawCurrentCanvasFrame(previewCurrentTime);
    } catch (err: any) {
      showToast(`Lỗi Audio: ${err.message || 'Thử lại'}`);
    }
  };

  // 3. Regenerate Visual
  const handleRegenerateVisual = async () => {
    showToast(`Đang tái tạo Visual cho Scene ${currentScene.sceneId}...`);
    try {
      await visualEngine.generateSceneVisual({
        sceneId: String(currentScene.sceneId),
        sceneType: currentScene.type,
        visualPrompt: currentScene.visualPrompt,
        assetType: 'image',
        duration: currentScene.duration,
        aspectRatio: composerConfig.format === '9:16' ? '9:16' : '16:9',
        style: 'warm_educational_animation',
      });
      showToast(`Đã tái tạo xong Visual cho Scene ${currentScene.sceneId}!`);
      drawCurrentCanvasFrame(previewCurrentTime);
    } catch (err: any) {
      showToast(`Lỗi Visual: ${err.message || 'Thử lại'}`);
    }
  };

  // Bắt đầu quy trình Export 6 bước
  const handleStartExport = async () => {
    setIsExportModalOpen(true);
    setExportResult(null);

    try {
      const res = await videoComposer.exportFullLessonVideo(
        scenes,
        composerConfig,
        (step, percent, desc) => {
          setExportStep(step);
          setExportPercent(percent);
          setExportDesc(desc);
        }
      );
      setExportResult(res);
      setExportStep('completed');
    } catch (err: any) {
      console.error('Lỗi khi xuất video:', err);
      setExportDesc(`Lỗi: ${err.message || 'Không thể tạo video'}`);
    }
  };

  const handleDownloadMp4 = () => {
    if (!exportResult) return;
    const a = document.createElement('a');
    a.href = exportResult.videoUrl;
    const safeTitle = lesson.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = exportResult.fileExtension;
    a.download = `${safeTitle}_${composerConfig.format.replace(':', 'x')}_${composerConfig.fps}fps.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeRes = VIDEO_FORMAT_RESOLUTIONS[composerConfig.format];

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-xs">
          <Sparkles className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Bar: Composer Overview & Format Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-1">
            <Film className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">VIDEO COMPOSER</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Dựng & Nối ghép bài giảng video hoàn chỉnh</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {scenes.length} Scenes · 24fps
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Render 10 lớp độc lập từng scene (Visual, Hán tự, Pinyin, Dịch nghĩa, Highlight, Audio, Transition) trước khi đóng gói MP4.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">{composerConfig.format} · {composerConfig.fps}fps</span>
          <button onClick={() => setInspectorTab('export')} className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Settings2 className="w-3.5 h-3.5" /> Cài đặt</button>
          <button onClick={handleStartExport} className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Xuất video</button>
        </div></div>
      </div>

      {/* 2. Timeline Navigation of 8 Scenes */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          {scenes.length} scenes:
        </span>
        {scenes.map((s, idx) => {
          const isSelected = activeSceneIndex === idx;
          const hasAudio = Boolean(audioEngine.getAudioForScene(s.sceneId));
          const hasVisual = Boolean(visualEngine.getVisualForScene(s.sceneId));

          return (
            <button
              key={s.sceneId}
              onClick={() => setActiveSceneIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all shrink-0 border flex items-center gap-2 text-left ${
                isSelected
                  ? 'bg-rose-50 text-rose-950 border-rose-300 font-bold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {s.sceneId}
              </span>
              <span className="truncate max-w-[110px]">{s.type.toUpperCase()}</span>
              
              {/* Badges */}
              <div className="flex items-center gap-1">
                {hasAudio && <Volume2 className="w-3 h-3 text-emerald-600" />}
                {hasVisual && <Film className="w-3 h-3 text-rose-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Stage: Left Canvas Player & Right Scene Inspector / Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left (7 cols): Offscreen/Interactive 1080p 24fps Canvas Screen */}
        <div className="lg:col-span-7 bg-slate-950 p-4 rounded-2xl shadow-xl space-y-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Canvas 24fps Renderer</span>
            </span>
            <span>{activeRes.label}</span>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative w-full flex justify-center items-center overflow-hidden rounded-xl bg-black">
            <canvas
              ref={canvasRef}
              className={`w-full max-h-[500px] object-contain rounded-xl shadow-2xl transition-all ${
                composerConfig.format === '9:16' ? 'max-w-[280px] aspect-[9/16]' : 'aspect-[16/9]'
              }`}
            />
          </div>

          {/* Player controls */}
          <div className="w-full p-2 bg-slate-900 rounded-xl flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors"
                title={isPlayingPreview ? 'Dừng' : 'Phát thử Scene'}
              >
                {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setIsPlayingPreview(false);
                  setPreviewCurrentTime(0);
                  setActiveAudioSegment(null);
                  drawCurrentCanvasFrame(0);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
                title="Về đầu Scene"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="font-mono text-slate-400 tabular-nums">
                {previewCurrentTime.toFixed(1)}s / {currentScene?.duration || 15}s
              </span>
            </div>

            <div className="min-w-0 max-w-[48%] text-[11px] text-slate-400 text-right">
              <span className="block truncate">{activeAudioSegment?.type === 'chinese_dialogue' ? `Đang đọc: ${activeAudioSegment.text}` : activeAudioSegment?.type === 'teacher_explanation' ? 'Đang giảng giải' : `Scene ${currentScene?.sceneId}`}</span>
            </div>
          </div>
        </div>

        <SceneInspector
          currentScene={currentScene}
          activeAudioSegment={activeAudioSegment}
          previewCurrentTime={previewCurrentTime}
          composerConfig={composerConfig}
          setComposerConfig={setComposerConfig}
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          isEditingScene={isEditingScene}
          setIsEditingScene={setIsEditingScene}
          editedChinese={editedChinese}
          setEditedChinese={setEditedChinese}
          editedPinyin={editedPinyin}
          setEditedPinyin={setEditedPinyin}
          editedVietnamese={editedVietnamese}
          setEditedVietnamese={setEditedVietnamese}
          editedExplanation={editedExplanation}
          setEditedExplanation={setEditedExplanation}
          editedDuration={editedDuration}
          setEditedDuration={setEditedDuration}
          editedVoice={editedVoice}
          setEditedVoice={setEditedVoice}
          editedSpeed={editedSpeed}
          setEditedSpeed={setEditedSpeed}
          handleSaveSceneEdits={handleSaveSceneEdits}
          handleRegenerateScene={handleRegenerateScene}
          handleRegenerateAudio={handleRegenerateAudio}
          handleRegenerateVisual={handleRegenerateVisual}
          handleStartExport={handleStartExport}
          drawCurrentCanvasFrame={drawCurrentCanvasFrame}
        />
      </div>

      {/* 4. Export Progress & Completed Player Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {exportStep === 'completed' ? 'Xuất video hoàn tất' : 'Đang dựng video...'}
                </h3>
              </div>
            </div>

            {/* 6 Steps Progress Bar */}
            {exportStep !== 'completed' ? (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Bước hiện tại: {EXPORT_STEP_LABELS[exportStep]?.label || exportStep}</span>
                    <span className="font-mono text-rose-600">{exportPercent}%</span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-600 transition-all duration-300 rounded-full"
                      style={{ width: `${exportPercent}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-mono italic">
                  {exportDesc}
                </p>

                {/* 6 Steps List Indicator */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                  {[
                    { step: 'preparing', text: '1. Preparing' },
                    { step: 'generating_audio', text: '2. Generating audio' },
                    { step: 'generating_visuals', text: '3. Generating visuals' },
                    { step: 'rendering_scenes', text: '4. Rendering scenes' },
                    { step: 'combining_video', text: '5. Combining video' },
                    { step: 'finalizing', text: '6. Finalizing' },
                  ].map((s) => {
                    const isDone = exportPercent >= (EXPORT_STEP_LABELS[s.step as ExportPipelineStep]?.percent || 0);
                    return (
                      <div key={s.step} className="flex items-center gap-1.5 text-slate-600">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                        )}
                        <span className={isDone ? 'font-semibold text-slate-900' : ''}>{s.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Completed Screen: Video Player & 3 Action Buttons */
              <div className="space-y-5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Đã đóng gói {scenes.length} scenes ({exportResult?.mimeType}, {exportResult?.durationSeconds}s, {exportResult?.fileSizeMb} MB).
                  </span>
                </div>

                {/* Real Video Player */}
                {exportResult?.videoUrl && (
                  <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden shadow-md">
                    <video
                      src={exportResult.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    onClick={handleDownloadMp4}
                    className="w-full sm:flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {exportResult?.fileExtension === 'mp4' ? 'MP4' : 'WebM'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsExportModalOpen(false);
                      onNavigateToTab('import');
                    }}
                    className="w-full sm:flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create another lesson</span>
                  </button>

                  <button
                    onClick={() => setIsExportModalOpen(false)}
                    className="w-full sm:flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit lesson</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
