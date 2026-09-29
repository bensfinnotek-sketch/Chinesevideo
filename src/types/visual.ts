/**
 * Visual Generator Type Definitions
 * Chuẩn hóa cấu trúc theo yêu cầu:
 * {
 *   "sceneId": "",
 *   "visualPrompt": "",
 *   "assetType": "image | video",
 *   "duration": 0
 * }
 */

export type VisualAssetType = 'image' | 'video';

export type VisualMode = 
  | 'no_visual'      // Không dùng visual (chỉ dùng phông màu ấm áp tối giản YouTube)
  | 'ai_image'       // Sinh hình ảnh minh họa bằng AI (Gemini Flash Lite Image)
  | 'ai_video'       // Sinh video B-roll bằng AI (Veo 3.1 Lite)
  | 'upload_image'   // Người dùng tải ảnh tự chọn
  | 'upload_video';  // Người dùng tải video tự chọn

export type VisualStyle =
  | 'warm_educational_animation' // Hoạt họa sư phạm ấm áp kiểu Ghibli / Shinkai
  | 'clean_chinese_classroom'    // Lớp học Trung Quốc hiện đại, ánh sáng tự nhiên
  | 'cinematic_broll'            // Thước phim B-roll điện ảnh đời sống
  | 'cozy_campus_lifestyle';     // Đời sống sinh viên, quán cafe, thư viện ấm cúng

export interface SceneVisualMetadata {
  sceneId: string;
  visualPrompt: string;
  assetType: VisualAssetType;
  duration: number; // Phù hợp với duration của scene
  visualMode: VisualMode;
  url?: string; // Data URL, Blob URL hoặc URL video
  thumbnailUrl?: string;
  style?: VisualStyle;
  aspectRatio: '16:9' | '9:16';
  fileName?: string;
  status: 'idle' | 'generating' | 'ready' | 'error';
  error?: string;
  createdAt?: number;
}

export interface VisualGenerationRequest {
  sceneId: string;
  sceneType: string;
  visualPrompt: string;
  assetType: VisualAssetType;
  duration: number;
  aspectRatio: '16:9' | '9:16';
  style: VisualStyle;
  topic?: string;
  highlightWords?: string[];
}
