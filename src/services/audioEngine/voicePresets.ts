import { VoiceConfigOption } from './types';

export const AVAILABLE_VOICES: VoiceConfigOption[] = [
  // 1. Giáo viên tiếng Trung (Mandarin chuẩn)
  {
    id: 'zh_teacher_kore',
    name: 'Kore (Cô Lý - Bắc Kinh)',
    gender: 'female',
    language: 'zh-CN',
    role: 'chinese_teacher',
    description: 'Giọng nữ chuẩn Bắc Kinh, ngữ điệu sư phạm rõ ràng, dễ nghe',
    geminiVoiceName: 'Kore',
  },
  {
    id: 'zh_teacher_charon',
    name: 'Charon (Thầy Trương - Bắc Kinh)',
    gender: 'male',
    language: 'zh-CN',
    role: 'chinese_teacher',
    description: 'Giọng nam trầm ấm, phát âm chuẩn đài phát thanh quốc gia',
    geminiVoiceName: 'Charon',
  },
  {
    id: 'zh_teacher_zephyr',
    name: 'Zephyr (Cô Vương - Thượng Hải)',
    gender: 'female',
    language: 'zh-CN',
    role: 'chinese_teacher',
    description: 'Giọng nữ trong trẻo, vui tươi, tốc độ tự nhiên',
    geminiVoiceName: 'Zephyr',
  },

  // 2. Giáo viên tiếng Việt (Giảng giải & phân tích)
  {
    id: 'vi_teacher_puck',
    name: 'Puck (Thầy Tuấn - Hà Nội)',
    gender: 'male',
    language: 'vi-VN',
    role: 'vietnamese_teacher',
    description: 'Giọng nam ấm áp, giải thích sư phạm gần gũi, khích lệ',
    geminiVoiceName: 'Puck',
  },
  {
    id: 'vi_teacher_kore',
    name: 'Kore (Cô Mai - Hà Nội)',
    gender: 'female',
    language: 'vi-VN',
    role: 'vietnamese_teacher',
    description: 'Giọng nữ dịu dàng, truyền cảm, giải thích ngữ pháp khúc chiết',
    geminiVoiceName: 'Kore',
  },
  {
    id: 'vi_teacher_fenrir',
    name: 'Fenrir (Thầy Nam - Sư phạm)',
    gender: 'male',
    language: 'vi-VN',
    role: 'vietnamese_teacher',
    description: 'Giọng nam đĩnh đạc, rõ từng khẩu hình và mẹo phát âm',
    geminiVoiceName: 'Fenrir',
  },

  // 3. Nhân vật A (Hội thoại)
  {
    id: 'char_a_kore',
    name: 'Nhân vật A - Tiểu Minh (Nữ)',
    gender: 'female',
    language: 'zh-CN',
    role: 'character_a',
    description: 'Giọng nữ Bắc Kinh năng động, đời thường, tự nhiên',
    geminiVoiceName: 'Kore',
  },
  {
    id: 'char_a_zephyr',
    name: 'Nhân vật A - Lan Hương (Nữ)',
    gender: 'female',
    language: 'zh-CN',
    role: 'character_a',
    description: 'Giọng nữ trẻ trung, khẩu ngữ sinh động',
    geminiVoiceName: 'Zephyr',
  },

  // 4. Nhân vật B (Hội thoại)
  {
    id: 'char_b_puck',
    name: 'Nhân vật B - Đại Hùng (Nam)',
    gender: 'male',
    language: 'zh-CN',
    role: 'character_b',
    description: 'Giọng nam thân thiện, phát âm dứt khoát',
    geminiVoiceName: 'Puck',
  },
  {
    id: 'char_b_fenrir',
    name: 'Nhân vật B - Cao Phong (Nam)',
    gender: 'male',
    language: 'zh-CN',
    role: 'character_b',
    description: 'Giọng nam Bắc Kinh trầm ấm, điềm tĩnh',
    geminiVoiceName: 'Fenrir',
  },
];

export const DEFAULT_AUDIO_ENGINE_SETTINGS = {
  provider: 'gemini_tts' as const,
  speedMode: 'normal' as const,
  includePinyinAudio: false, // Mặc định false: không đọc Pinyin trong phần Chinese dialogue
  pauseBetweenSentencesMs: 600,
  chineseTeacherVoice: 'Kore',
  vietnameseTeacherVoice: 'Puck',
  characterAVoice: 'Kore',
  characterBVoice: 'Puck',
  speechModeTarget: 'full_scene' as const,
};
