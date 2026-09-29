import { 
  ITTSProvider, 
  TTSProviderId, 
  AudioEngineSettings, 
  AudioMetadata, 
  AudioSegment, 
  TTSSpeedMode,
  KaraokeToken 
} from './types';
import { LessonScene } from '../../types/lesson';
import { GeminiTTSProvider } from './providers/geminiTTSProvider';
import { WebSpeechTTSProvider } from './providers/webSpeechTTSProvider';
import { DEFAULT_AUDIO_ENGINE_SETTINGS } from './voicePresets';
import { speakChinese, stopSpeaking } from '../audioSynthesis';
import { buildKaraokeTokens } from './karaokeTiming';

export class AudioEngineService {
  private static instance: AudioEngineService;

  private providers: Map<TTSProviderId, ITTSProvider> = new Map();
  private settings: AudioEngineSettings = { ...DEFAULT_AUDIO_ENGINE_SETTINGS };
  private sceneAudios: Map<string, AudioMetadata> = new Map();

  // Playback state
  private currentAudioElement: HTMLAudioElement | null = null;
  private playbackTimer: any = null;
  private activePlayingSceneId: string | null = null;

  private constructor() {
    this.registerProvider(new GeminiTTSProvider());
    this.registerProvider(new WebSpeechTTSProvider());
  }

  public static getInstance(): AudioEngineService {
    if (!AudioEngineService.instance) {
      AudioEngineService.instance = new AudioEngineService();
    }
    return AudioEngineService.instance;
  }

  public registerProvider(provider: ITTSProvider) {
    this.providers.set(provider.id, provider);
  }

  public getAvailableProviders(): ITTSProvider[] {
    return Array.from(this.providers.values());
  }

  public getSettings(): AudioEngineSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AudioEngineSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getActiveProvider(): ITTSProvider {
    const provider = this.providers.get(this.settings.provider);
    if (!provider || !provider.isAvailable()) {
      return this.providers.get('web_speech') || new WebSpeechTTSProvider();
    }
    return provider;
  }

  public getAudioForScene(sceneId: string | number): AudioMetadata | undefined {
    return this.sceneAudios.get(String(sceneId));
  }

  public getAllAudios(): Map<string, AudioMetadata> {
    return this.sceneAudios;
  }

  public setAudioForScene(metadata: AudioMetadata) {
    this.sceneAudios.set(String(metadata.sceneId), metadata);
  }

  /**
   * Update manual karaoke phrase timing without regenerating TTS audio.
   * Tokens are sorted, clamped to the scene duration and re-indexed.
   */
  public updateKaraokeTokens(sceneId: string | number, tokens: KaraokeToken[]) {
    const metadata = this.sceneAudios.get(String(sceneId));
    if (!metadata) return;

    const duration = Math.max(0.05, metadata.duration || 0.05);
    const normalized = tokens
      .map(token => ({
        ...token,
        text: token.text.trim(),
        start: Math.max(0, Math.min(duration, Number(token.start) || 0)),
        end: Math.max(0, Math.min(duration, Number(token.end) || 0)),
      }))
      .filter(token => token.text && token.end > token.start)
      .sort((a, b) => a.start - b.start)
      .map((token, index) => ({ ...token, index }));

    metadata.karaokeTokens = normalized;
    this.sceneAudios.set(String(sceneId), metadata);
  }

  /**
   * Tạo âm thanh cho một Scene cụ thể
   */
  public async generateSceneAudio(scene: LessonScene): Promise<AudioMetadata> {
    const provider = this.getActiveProvider();
    const metadata = await provider.synthesizeScene({
      scene,
      speedMode: this.settings.speedMode,
      includePinyinAudio: this.settings.includePinyinAudio,
      pauseBetweenSentencesMs: this.settings.pauseBetweenSentencesMs,
      chineseTeacherVoice: this.settings.chineseTeacherVoice,
      vietnameseTeacherVoice: this.settings.vietnameseTeacherVoice,
      characterAVoice: this.settings.characterAVoice,
      characterBVoice: this.settings.characterBVoice,
      speechModeTarget: this.settings.speechModeTarget,
    });

    metadata.karaokeTokens = buildKaraokeTokens(metadata.segments, scene.highlightWords || []);
    this.sceneAudios.set(String(scene.sceneId), metadata);
    return metadata;
  }

  /**
   * Tạo âm thanh đồng loạt cho tất cả 8 scenes
   */
  public async generateAllScenesAudio(
    scenes: LessonScene[],
    onProgress?: (completed: number, total: number, currentSceneId: number) => void
  ): Promise<Map<string, AudioMetadata>> {
    let completed = 0;
    const total = scenes.length;

    for (const scene of scenes) {
      if (onProgress) {
        onProgress(completed, total, scene.sceneId);
      }
      try {
        await this.generateSceneAudio(scene);
      } catch (err) {
        console.error(`Lỗi khi tạo audio cho Scene ${scene.sceneId}:`, err);
      }
      completed++;
      if (onProgress) {
        onProgress(completed, total, scene.sceneId);
      }
    }

    return this.sceneAudios;
  }

  /**
   * Phát âm thanh Scene đồng bộ với highlight Segment
   */
  public playSceneAudio(
    scene: LessonScene,
    onTimeUpdate?: (currentTime: number, activeSegment: AudioSegment | null) => void,
    onEnded?: () => void
  ): { stop: () => void } {
    this.stopAudio();

    const sceneId = String(scene.sceneId);
    this.activePlayingSceneId = sceneId;
    const metadata = this.sceneAudios.get(sceneId);

    // 1. Nếu có audioUrl hợp lệ (Data URL hoặc Blob URL)
    if (metadata && metadata.audioUrl && metadata.audioUrl.startsWith('data:audio')) {
      const audio = new Audio(metadata.audioUrl);
      this.currentAudioElement = audio;

      const rate = this.settings.speedMode === 'very_slow' ? 0.7 : this.settings.speedMode === 'slow' ? 0.85 : 1.0;
      audio.playbackRate = rate;

      const updateHandler = () => {
        const currentSec = audio.currentTime;
        const activeSeg = metadata.segments.find(s => currentSec >= s.start && currentSec <= s.end) || null;
        if (onTimeUpdate) {
          onTimeUpdate(currentSec, activeSeg);
        }
      };

      audio.ontimeupdate = updateHandler;
      audio.onended = () => {
        if (onEnded) onEnded();
        this.activePlayingSceneId = null;
      };

      audio.play().catch(err => {
        console.warn('HTMLAudioElement play failed, falling back to Web Speech:', err);
        this.fallbackPlayWebSpeech(scene, metadata, onTimeUpdate, onEnded);
      });

      return {
        stop: () => this.stopAudio(),
      };
    }

    // 2. Fallback sử dụng Web Speech API
    this.fallbackPlayWebSpeech(scene, metadata, onTimeUpdate, onEnded);
    return {
      stop: () => this.stopAudio(),
    };
  }

  private fallbackPlayWebSpeech(
    scene: LessonScene,
    metadata?: AudioMetadata,
    onTimeUpdate?: (currentTime: number, activeSegment: AudioSegment | null) => void,
    onEnded?: () => void
  ) {
    const textToSpeak = scene.chineseText || scene.teacherExplanation || '';
    const speed = this.settings.speedMode === 'very_slow' ? 0.65 : this.settings.speedMode === 'slow' ? 0.8 : 1.0;
    const duration = metadata?.duration || Math.max(2, scene.duration);

    speakChinese(textToSpeak, speed);

    let currentSec = 0;
    const intervalMs = 100;
    this.playbackTimer = setInterval(() => {
      currentSec += intervalMs / 1000;
      const activeSeg = metadata?.segments.find(s => currentSec >= s.start && currentSec <= s.end) || null;

      if (onTimeUpdate) {
        onTimeUpdate(currentSec, activeSeg);
      }

      if (currentSec >= duration) {
        this.stopAudio();
        if (onEnded) onEnded();
      }
    }, intervalMs);
  }

  public stopAudio() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    stopSpeaking();
    this.activePlayingSceneId = null;
  }

  public isScenePlaying(sceneId: string | number): boolean {
    return this.activePlayingSceneId === String(sceneId);
  }
}

export const audioEngine = AudioEngineService.getInstance();
