/**
 * Audio / TTS Engine Type Definitions
 * Thiết kế theo mô hình Abstraction Layer cho phép hoán đổi linh hoạt giữa:
 * - Gemini 3.8 Flash Lite TTS (AI Studio Cloud Audio - Chất lượng phòng thu)
 * - Web Speech API (Client-side native Mandarin zh-CN & Vietnamese vi-VN)
 * - Custom / Edge TTS Provider
 */

import { LessonScene } from '../../types/lesson';

export type TTSVoiceType =
  | 'chinese_teacher'     // Giáo viên tiếng Trung (giọng Bắc Kinh chuẩn)
  | 'vietnamese_teacher'  // Giáo viên tiếng Việt (ấm áp, tự nhiên)
  | 'character_a'         // Nhân vật A (Hội thoại - giọng nữ Bắc Kinh)
  | 'character_b';        // Nhân vật B (Hội thoại - giọng nam Bắc Kinh)

export type TTSSpeedMode = 'normal' | 'slow' | 'very_slow';

export type TTSProviderId = 'gemini_tts' | 'web_speech';

export interface KaraokeToken {
  text: string;
  pinyin?: string;
  pinyinSyllables?: string[];
  start: number;
  end: number;
  index: number;
  sourceSegmentIndex: number;
}

export interface AudioSegment {
  text: string;
  start: number; // thời điểm bắt đầu (giây)
  end: number;   // thời điểm kết thúc (giây)
  pinyin?: string;
  vietnamese?: string;
  speaker?: string;
  type?: 'chinese_dialogue' | 'teacher_explanation' | 'pause';
}

export interface AudioMetadata {
  sceneId: string;
  audioUrl: string; // URL âm thanh (data:audio/wav;base64,... hoặc blob URL)
  duration: number; // thời lượng tính bằng giây
  language: 'zh-CN' | 'vi-VN' | 'mixed';
  voice: string;
  speedMode: TTSSpeedMode;
  segments: AudioSegment[];
  karaokeTokens?: KaraokeToken[];
  createdAt?: number;
  provider?: string;
  sceneType?: string;
}

export interface TTSRequest {
  sceneId: string;
  text: string;
  pinyin?: string;
  vietnamese?: string;
  language: 'zh-CN' | 'vi-VN' | 'mixed';
  voiceType: TTSVoiceType;
  speedMode: TTSSpeedMode;
  includePinyinAudio?: boolean; // Pinyin chỉ dùng để hiển thị cho người học, không đọc trong hội thoại trừ khi bật chế độ luyện Pinyin
  pauseBetweenSentencesMs?: number;
  speakerName?: string;
}

export interface SceneAudioRequest {
  scene: LessonScene;
  speedMode: TTSSpeedMode;
  includePinyinAudio?: boolean;
  pauseBetweenSentencesMs?: number;
  chineseTeacherVoice?: string;
  vietnameseTeacherVoice?: string;
  characterAVoice?: string;
  characterBVoice?: string;
  speechModeTarget?: 'dialogue_only' | 'explanation_only' | 'full_scene';
}

export interface VoiceConfigOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  language: 'zh-CN' | 'vi-VN';
  role: TTSVoiceType;
  description: string;
  geminiVoiceName?: string; // Puck, Charon, Kore, Fenrir, Zephyr
}

export interface AudioEngineSettings {
  provider: TTSProviderId;
  speedMode: TTSSpeedMode;
  includePinyinAudio: boolean; // Mặc định false: không đọc Pinyin trong hội thoại
  pauseBetweenSentencesMs: number;
  chineseTeacherVoice: string;
  vietnameseTeacherVoice: string;
  characterAVoice: string;
  characterBVoice: string;
  speechModeTarget: 'dialogue_only' | 'explanation_only' | 'full_scene';
}

export interface ITTSProvider {
  id: TTSProviderId;
  name: string;
  description: string;
  isAvailable(): boolean;
  synthesize(request: TTSRequest): Promise<AudioMetadata>;
  synthesizeScene(request: SceneAudioRequest): Promise<AudioMetadata>;
}
