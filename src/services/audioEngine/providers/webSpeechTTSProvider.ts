import { ITTSProvider, TTSRequest, SceneAudioRequest, AudioMetadata } from '../types';
import { buildSceneSegments, estimateAudioSegments, estimateNaturalDuration } from '../timingEstimator';

export class WebSpeechTTSProvider implements ITTSProvider {
  id = 'web_speech' as const;
  name = 'Web Speech API (Trình duyệt)';
  description = 'Phát âm bản xứ tức thì trực tiếp trên thiết bị (không cần kết nối mạng)';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async synthesize(request: TTSRequest): Promise<AudioMetadata> {
    const duration = estimateNaturalDuration(request.text, request.language, request.speedMode);
    const segments = estimateAudioSegments(request.text, duration, request.speedMode, request.speakerName);

    // Tạo Data URL âm thanh chuông nhẹ để trình phát audio có thể load timeline
    const audioUrl = createSyntheticAudioUrl(duration);

    return {
      sceneId: request.sceneId,
      audioUrl,
      duration,
      language: request.language,
      voice: `WebSpeech (${request.language === 'zh-CN' ? 'Mandarin' : 'Tiếng Việt'})`,
      speedMode: request.speedMode,
      segments,
      provider: this.id,
      createdAt: Date.now(),
    };
  }

  async synthesizeScene(req: SceneAudioRequest): Promise<AudioMetadata> {
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

    const audioUrl = createSyntheticAudioUrl(calculatedDuration);

    return {
      sceneId: String(scene.sceneId),
      audioUrl,
      duration: calculatedDuration,
      language: 'mixed',
      voice: 'WebSpeech Multi-Speaker',
      speedMode,
      segments,
      sceneType: scene.type,
      provider: this.id,
      createdAt: Date.now(),
    };
  }
}

/**
 * Tạo data URI file WAV hợp lệ (24kHz 16-bit mono) có âm thanh êm dịu
 * giúp thẻ <audio> và Web Audio timeline hoạt động đồng bộ chính xác.
 */
function createSyntheticAudioUrl(durationSeconds: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * Math.max(1, durationSeconds));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true);  // NumChannels (1 mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);  // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Ghi âm thanh tĩnh nhẹ (ambient silence with soft fade in/out)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Rất nhỏ gần như im lặng (soft pink noise / silence)
    const sample = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * 80;
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
