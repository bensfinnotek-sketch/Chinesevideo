import { ITTSProvider, TTSRequest, SceneAudioRequest, AudioMetadata } from '../types';
import { buildSceneSegments, estimateAudioSegments, estimateNaturalDuration } from '../timingEstimator';

export class GeminiTTSProvider implements ITTSProvider {
  id = 'gemini_tts' as const;
  name = 'Gemini 3.8 Flash Lite TTS';
  description = 'Âm thanh chất lượng cao Google AI Studio (giọng Mandarin chuẩn & tiếng Việt tự nhiên)';

  isAvailable(): boolean {
    return true;
  }

  async synthesize(request: TTSRequest): Promise<AudioMetadata> {
    try {
      const response = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.metadata;
    } catch (error) {
      console.warn('GeminiTTSProvider.synthesize fallback to synthetic metadata:', error);
      // Fallback metadata khi offline hoặc lỗi API
      const duration = estimateNaturalDuration(request.text, request.language, request.speedMode);
      const segments = estimateAudioSegments(request.text, duration, request.speedMode, request.speakerName);

      return {
        sceneId: request.sceneId,
        audioUrl: '', // Sẽ dùng Web Speech fallback khi phát
        duration,
        language: request.language,
        voice: `${request.voiceType} (Gemini fallback)`,
        speedMode: request.speedMode,
        segments,
        provider: this.id,
        createdAt: Date.now(),
      };
    }
  }

  async synthesizeScene(req: SceneAudioRequest): Promise<AudioMetadata> {
    try {
      const response = await fetch('/api/tts/synthesize-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.metadata;
    } catch (error) {
      console.warn('GeminiTTSProvider.synthesizeScene fallback:', error);
      const { scene, speedMode, includePinyinAudio, pauseBetweenSentencesMs } = req;
      const { segments, calculatedDuration } = buildSceneSegments(
        scene.teacherExplanation,
        scene.chineseText,
        scene.pinyin,
        scene.duration,
        speedMode,
        includePinyinAudio,
        pauseBetweenSentencesMs
      );

      return {
        sceneId: String(scene.sceneId),
        audioUrl: '',
        duration: calculatedDuration,
        language: 'mixed',
        voice: 'Gemini Auto Voice',
        speedMode,
        segments,
        sceneType: scene.type,
        provider: this.id,
        createdAt: Date.now(),
      };
    }
  }
}
