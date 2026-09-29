import { PipelineStageInfo } from '../types/lesson';

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 'file_import',
    stepNumber: 1,
    name: 'File Import',
    subtitle: 'Nạp tài liệu đa định dạng',
    description: 'Hỗ trợ kéo thả TXT, CSV, XLSX, DOCX, PDF và Ảnh chứa chữ Hán. Đọc buffer và chuẩn hóa dữ liệu đầu vào.',
    moduleFile: 'src/components/import/FileImportSection.tsx',
    status: 'operational'
  },
  {
    id: 'chinese_parser',
    stepNumber: 2,
    name: 'Chinese Content Parser',
    subtitle: 'Phân tích & Tách từ vựng / Câu',
    description: 'Trích xuất chữ Hán, phát hiện Pinyin, dịch nghĩa tiếng Việt, tra cứu âm Hán Việt và tạo câu ví dụ thực tế.',
    moduleFile: 'src/components/parser/VocabTable.tsx',
    status: 'operational'
  },
  {
    id: 'lesson_generator',
    stepNumber: 3,
    name: 'Lesson Generator',
    subtitle: 'Kiến tạo cấu trúc bài giảng',
    description: 'Tổ chức bài học theo sư phạm: Khởi động, giải nghĩa từ vựng trọng tâm, mẹo nhớ chữ Hán, và bài tập củng cố.',
    moduleFile: 'src/components/lesson/LessonPreviewSection.tsx',
    status: 'operational'
  },
  {
    id: 'dialogue_generator',
    stepNumber: 4,
    name: 'Dialogue Generator',
    subtitle: 'Hội thoại ứng dụng ngữ cảnh',
    description: 'Tự động sáng tạo đoạn đối thoại tự nhiên giữa 2 nhân vật (Người A & Người B) áp dụng ngay các từ vừa học.',
    moduleFile: 'src/components/lesson/DialogueSection.tsx',
    status: 'operational'
  },
  {
    id: 'tts_generator',
    stepNumber: 5,
    name: 'TTS Generator',
    subtitle: 'Tổng hợp giọng đọc AI chuẩn',
    description: 'Hỗ trợ Gemini 3.8 Flash Lite TTS & Web Speech API. 2 loại voice: Chinese Teacher (Mandarin chuẩn) & Vietnamese Teacher, cùng Character A & B. 3 tốc độ: Normal, Slow, Very Slow. Metadata segments chính xác.',
    moduleFile: 'src/services/audioEngine/audioEngineService.ts',
    status: 'operational'
  },
  {
    id: 'visual_generator',
    stepNumber: 6,
    name: 'Visual Generator',
    subtitle: 'Tạo hình ảnh & Video minh họa AI',
    description: 'Sinh hình ảnh (Gemini) & video B-roll (Veo 16:9) không chứa text. Hỗ trợ 5 chế độ: No visual, AI image, AI video, Upload image, Upload video. Style lớp học ấm áp, B-roll điện ảnh.',
    moduleFile: 'src/services/visualEngine/visualEngineService.ts',
    status: 'operational'
  },
  {
    id: 'video_composer',
    stepNumber: 7,
    name: 'Video Composer',
    subtitle: 'Nối ghép 10 lớp Scene & 24fps MP4',
    description: 'Render độc lập 10 lớp: Visual, Hán tự, Pinyin, Tiếng Việt, Highlight, Audio, Sound effect, Safe area 10%, Transition. Xuất MP4 16:9 / 9:16 / 1:1.',
    moduleFile: 'src/components/composer/VideoComposerStudio.tsx',
    status: 'operational'
  },
  {
    id: 'video_exporter',
    stepNumber: 8,
    name: 'Video Exporter',
    subtitle: 'Xuất video & Tài liệu đính kèm',
    description: 'Xuất file MP4 (1080p, 720p, 4K), tỷ lệ 16:9 (Youtube) hoặc 9:16 (TikTok), phụ đề SRT/VTT và tài liệu PDF ôn tập.',
    moduleFile: 'src/components/export/VideoExportModal.tsx',
    status: 'operational'
  }
];
