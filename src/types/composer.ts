import { LessonScene } from './lesson';
import { AudioMetadata, TTSSpeedMode } from '../services/audioEngine/types';
import { SceneVisualMetadata } from './visual';

export type VideoFormat = '16:9' | '9:16' | '1:1';

export interface VideoResolution {
  width: number;
  height: number;
  label: string;
}

export const VIDEO_FORMAT_RESOLUTIONS: Record<VideoFormat, VideoResolution> = {
  '16:9': { width: 1920, height: 1080, label: '16:9 YouTube Full HD (1920x1080)' },
  '9:16': { width: 1080, height: 1920, label: '9:16 TikTok / Shorts (1080x1920)' },
  '1:1': { width: 1080, height: 1080, label: '1:1 Square (1080x1080)' },
};

export type TransitionType = 'crossfade' | 'dip_to_black' | 'slide_left' | 'cut';

export type ExportPipelineStep = 
  | 'idle'
  | 'preparing'
  | 'generating_audio'
  | 'generating_visuals'
  | 'rendering_scenes'
  | 'combining_video'
  | 'finalizing'
  | 'completed';

export const EXPORT_STEP_LABELS: Record<ExportPipelineStep, { label: string; percent: number; desc: string }> = {
  idle: { label: 'Sẵn sàng xuất video', percent: 0, desc: 'Bấm Bắt đầu Render để tiến hành' },
  preparing: { label: 'Preparing', percent: 10, desc: 'Khởi tạo Canvas 1080p 24fps & Safe Area' },
  generating_audio: { label: 'Generating audio', percent: 30, desc: 'Tổng hợp TTS tiếng Trung & tiếng Việt' },
  generating_visuals: { label: 'Generating visuals', percent: 50, desc: 'Chuẩn bị background & B-roll minh họa' },
  rendering_scenes: { label: 'Rendering scenes', percent: 75, desc: 'Vẽ 10 lớp đồ họa, text overlay & highlight' },
  combining_video: { label: 'Combining video', percent: 90, desc: 'Nối các scenes & hiệu ứng chuyển cảnh' },
  finalizing: { label: 'Finalizing', percent: 100, desc: 'Đóng gói file MP4 hoàn chỉnh' },
  completed: { label: 'Hoàn thành!', percent: 100, desc: 'Video đã sẵn sàng để xem & tải về' },
};

export interface ComposerSceneSettings {
  sceneId: number;
  chineseText: string;
  pinyin: string;
  vietnamese: string;
  teacherExplanation: string;
  voice: string;
  speedMode: TTSSpeedMode;
  duration: number; // giây
  transition: TransitionType;
  enableSoundEffect: boolean;
}

export interface VideoComposerConfig {
  format: VideoFormat;
  fps: number; // 24fps mặc định
  showSafeAreaGuide: boolean;
  enableTransitions: boolean;
  transitionType: TransitionType;
  transitionDurationSec: number;
  enableChimeSoundEffect: boolean;
  themeStyle: 'warm_paper' | 'studio_dark' | 'clean_white';
}
