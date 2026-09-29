/**
 * Chinese Video Lesson Maker - Core Type Definitions
 * Chuẩn hóa cấu trúc dữ liệu theo yêu cầu phân tích và kịch bản 8 Scenes của Gemini AI
 */

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'measure_word'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'phrase'
  | 'sentence'
  | 'other';

export const PART_OF_SPEECH_LABELS: Record<PartOfSpeech, string> = {
  noun: 'Danh từ (名词)',
  verb: 'Động từ (动词)',
  adjective: 'Tính từ (形容词)',
  adverb: 'Phó từ (副词)',
  measure_word: 'Lượng từ (量词)',
  pronoun: 'Đại từ (代词)',
  preposition: 'Giới từ (介词)',
  conjunction: 'Liên từ (连词)',
  phrase: 'Cụm từ (短语)',
  sentence: 'Câu (句子)',
  other: 'Khác (其他)'
};

export interface VocabItem {
  id: string;
  chinese: string;
  traditionalChinese: string;
  pinyin: string;
  vietnamese: string;
  partOfSpeech: PartOfSpeech;
  level: string;
  exampleChinese: string;
  examplePinyin: string;
  exampleVietnamese: string;
  usageNote: string;
  isAiVerified?: boolean;
  verificationNotes?: string;
  rawInput?: string;
}

// Quy trình Sư phạm Chuẩn (Pedagogical Flow)
// Context → Dialogue → Listen → Explanation → Vocabulary → Example → Repeat → Mini Practice
export type SceneType =
  | 'context'               // 1. Context: Đặt bối cảnh tình huống thực tế
  | 'dialogue'              // 2. Dialogue: Tình huống đối thoại tự nhiên giữa các nhân vật
  | 'listen'                // 3. Listen: Cho người học nghe lại trọn vẹn câu trong ngữ cảnh
  | 'explanation'           // 4. Explanation: Giáo viên phân tích sâu 5 yếu tố (nghĩa, cách dùng, sắc thái, cụm từ đi cùng, ví dụ khác)
  | 'vocabulary'            // 5. Vocabulary: Khắc sâu mặt chữ Hán, âm Hán Việt & thanh điệu
  | 'example'               // 6. Example: Mở rộng ví dụ câu ứng dụng thực tế
  | 'repeat'                // 7. Repeat: Luyện phản xạ mở miệng nhắc lại (Shadowing)
  | 'mini_practice'         // 8. Mini Practice: Thử thách mini tương tác củng cố phản xạ
  // Hỗ trợ tương thích ngược:
  | 'intro'
  | 'sentence_breakdown'
  | 'word_highlight'
  | 'grammar_usage'
  | 'new_examples'
  | 'listening_drill'
  | 'review_summary';

export const SCENE_TYPE_TITLES: Record<SceneType, { title: string; desc: string; badge: string; step: string }> = {
  context: {
    title: 'Context (Bối cảnh tình huống)',
    desc: 'Thiết lập ngữ cảnh đời sống thực tế, kích hoạt sự tò mò và kiến thức nền cho người học.',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    step: '1. Context'
  },
  dialogue: {
    title: 'Dialogue (Đối thoại tình huống)',
    desc: 'Hội thoại tự nhiên giữa 2 nhân vật, từ vựng xuất hiện hữu cơ thay vì đọc đơn lẻ.',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    step: '2. Dialogue'
  },
  listen: {
    title: 'Listen (Nghe cảm thụ phản xạ)',
    desc: 'Cho người học nghe lại ngữ điệu tự nhiên, mở rộng khả năng tiếp nhận thính giác.',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    step: '3. Listen'
  },
  explanation: {
    title: 'Explanation (Giảng giải 5 yếu tố sư phạm)',
    desc: 'Phân tích nghĩa, cách dùng, sắc thái trong câu, cụm từ đi cùng và ví dụ mở rộng.',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    step: '4. Explanation'
  },
  vocabulary: {
    title: 'Vocabulary (Đào sâu từ vựng & Âm Hán Việt)',
    desc: 'Khắc sâu hình thái chữ Hán, bộ thủ, thanh điệu chuẩn và liên hệ âm Hán Việt.',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    step: '5. Vocabulary'
  },
  example: {
    title: 'Example (Ví dụ thực tế mới)',
    desc: 'Đưa từ vựng vào một tình huống hoàn toàn mới để học viên linh hoạt ứng biến.',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    step: '6. Example'
  },
  repeat: {
    title: 'Repeat (Luyện phản xạ nhắc lại)',
    desc: 'Phương pháp Shadowing: Đọc chậm, có khoảng lặng ngắt nghỉ để người học nhắc lại to, rõ.',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    step: '7. Repeat'
  },
  mini_practice: {
    title: 'Mini Practice (Thử thách củng cố)',
    desc: 'Câu đố trắc nghiệm hoặc tình huống phản xạ nhanh giúp kiểm tra khả năng nhớ ngữ cảnh.',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    step: '8. Mini Practice'
  },
  // Tương thích ngược:
  intro: {
    title: 'Intro (Khởi động bài học)',
    desc: 'Lời mở đầu ấm áp, khơi gợi cảm hứng và giới thiệu mục tiêu bài học.',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    step: 'Intro'
  },
  sentence_breakdown: {
    title: 'Sentence Breakdown (Phân tích câu)',
    desc: 'Giáo viên phân tích cấu trúc, nghĩa tự nhiên và sắc thái biểu cảm của câu.',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    step: 'Breakdown'
  },
  word_highlight: {
    title: 'Word Highlight (Điểm nhấn từ vựng)',
    desc: 'Tập trung vào các từ vựng cốt lõi, âm Hán Việt và thanh điệu chuẩn.',
    badge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    step: 'Highlight'
  },
  grammar_usage: {
    title: 'Grammar Usage (Cách dùng & Lỗi thường gặp)',
    desc: 'Lưu ý sự khác biệt ngữ pháp giữa tiếng Trung và tiếng Việt, tránh dịch word-by-word.',
    badge: 'bg-red-50 text-red-700 border-red-200',
    step: 'Grammar'
  },
  new_examples: {
    title: 'New Examples (Ví dụ mới)',
    desc: 'Mở rộng câu ví dụ thực tế mới trong đời sống để học viên biết cách ứng biến.',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    step: 'Examples'
  },
  listening_drill: {
    title: 'Listening Drill (Luyện nghe)',
    desc: 'Đọc mẫu chậm rãi, có khoảng lặng để học viên luyện phát âm và ngữ điệu theo.',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    step: 'Listening'
  },
  review_summary: {
    title: 'Review Summary (Tổng kết)',
    desc: 'Tổng kết ngắn gọn điểm cốt lõi, giao thử thách nhỏ và lời chào tạm biệt.',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    step: 'Summary'
  }
};

export interface PedagogicalExplanation {
  meaning?: string;         // 1. Nghĩa của từ
  usage?: string;           // 2. Cách sử dụng chuẩn
  nuance?: string;          // 3. Sắc thái trong câu
  collocations?: string[];  // 4. Từ/cụm từ thường đi cùng (Collocations)
  additionalExample?: {     // 5. Một ví dụ khác
    chinese: string;
    pinyin: string;
    vietnamese: string;
  };
}

export interface LessonScene {
  sceneId: number;
  type: SceneType;
  duration: number; // thời lượng tính bằng giây
  characters: string[]; // ví dụ: ["Giáo viên"], ["Tiểu Minh (Nhân vật A)", "Lan Hương (Nhân vật B)"]
  chineseText: string;
  pinyin: string;
  vietnamese: string;
  teacherExplanation: string; // Lời giảng của giáo viên bằng tiếng Việt
  pedagogicalDetails?: PedagogicalExplanation; // 5 thành phần sư phạm chi tiết
  highlightWords: string[];
  /** Manual phrase-level karaoke timing saved with the scene. */
  karaokeTiming?: Array<{ text: string; pinyin?: string; start: number; end: number }>;
  voice: string; // ví dụ: "female_teacher_vi", "char_a_beijing_female", "char_b_beijing_male"
  visualPrompt: string; // Mô tả khung hình cho Visual Generator
  practiceQuestion?: { // Thử thách nhỏ cho mini practice
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export type LessonDurationTarget = 3 | 5 | 10 | 15; // phút

export interface GeneratedLessonPlan {
  lessonId: string;
  lessonIndex: number;
  totalLessons: number;
  title: string;
  topic: string;
  targetDurationMinutes: LessonDurationTarget;
  actualEstimatedDurationSeconds: number;
  targetVocabItems: VocabItem[];
  characters: {
    name: string;
    role: string;
    voice: string;
    description: string;
  }[];
  scenes: LessonScene[]; // Đúng chuẩn 8 Scenes
  createdAt: number;
}

export interface DialogueLine {
  id: string;
  speaker: 'Người A' | 'Người B' | 'Giáo viên' | 'Học viên';
  avatar?: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface LessonContent {
  id: string;
  title: string;
  topic: string;
  level: string;
  intro: string;
  vocabItems: VocabItem[];
  dialogue: DialogueLine[];
  practiceExercises: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  summary: string;
  // Kịch bản bài học 8 scenes
  script?: GeneratedLessonPlan;
}

export type AspectRatio = '16:9' | '9:16';
export type VideoResolution = '720p' | '1080p' | '4k';
export type VideoTheme = 'modern_minimal' | 'calligraphy_traditional' | 'classroom_bright' | 'cyber_dark';
export type VoicePersona = 'female_kore' | 'male_puck' | 'teacher_duo';

export interface VideoConfig {
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  theme: VideoTheme;
  voice: VoicePersona;
  speechSpeed: number; // 0.8x -> 1.2x
  pauseInterval: number; // giây dừng giữa mỗi từ vựng để học viên nhắc lại
  showPinyin: boolean;
  showSinoVietnamese: boolean;
  showVietnamese: boolean;
  showStrokeOrder: boolean;
  showAiIllustrations: boolean;
  repeatCount: number;
  bgmStyle: 'none' | 'light_study' | 'guzheng_calm' | 'lofi_acoustic';
  watermark: string;
}

export interface UploadedFileSummary {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  parsedCount: number;
}

export interface PipelineStageInfo {
  id: string;
  stepNumber: number;
  name: string;
  subtitle: string;
  description: string;
  moduleFile: string;
  status: 'operational' | 'ready_for_gemini' | 'extensible';
}
