/**
 * Canonical Lesson JSON
 *
 * Đây là data model trung tâm của pipeline:
 * Lesson JSON -> TTS / Visual -> Scene Renderer -> Video Composer -> MP4
 *
 * Không chứa dữ liệu UI. Vì vậy có thể thay đổi giao diện, font, voice,
 * visual renderer hoặc video renderer mà không cần tạo lại lesson.
 */

export type LessonJsonSceneType =
  | 'intro'
  | 'context'
  | 'dialogue'
  | 'listen'
  | 'explanation'
  | 'vocabulary'
  | 'example'
  | 'repeat'
  | 'mini_practice';

export type LessonJsonVideoFormat = '16:9' | '9:16' | '1:1';

export interface LessonJsonAudioConfig {
  language: string;
  voice?: string;
  speed?: number;
  speakerA?: string;
  speakerB?: string;
}

export interface LessonJsonDialogueLine {
  speaker: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface LessonJsonHighlight {
  text: string;
  start?: number;
  end?: number;
}

export interface LessonJsonScene {
  id: string;
  type: LessonJsonSceneType;
  duration: number;

  chinese?: string;
  pinyin?: string;
  vietnamese?: string;
  teacherExplanation?: string;

  dialogue?: LessonJsonDialogueLine[];
  highlightWords?: (string | LessonJsonHighlight)[];

  visualPrompt?: string;
  audio: LessonJsonAudioConfig;

  /**
   * Optional scene-level metadata used by the renderer.
   * Keeping this optional preserves a small, stable core schema.
   */
  transition?: {
    type?: 'crossfade' | 'dip_to_black' | 'slide_left' | 'cut';
    duration?: number;
  };
}

export interface LessonJsonDocument {
  lesson: {
    title: string;
    topic: string;
    level: string;
    targetLanguage: 'zh-CN' | string;
    explanationLanguage: 'vi' | string;
  };
  scenes: LessonJsonScene[];
}

/**
 * Runtime validation for imported/generated Lesson JSON.
 * This deliberately validates the stable contract, not UI-specific fields.
 */
export function isLessonJsonDocument(value: unknown): value is LessonJsonDocument {
  if (!value || typeof value !== 'object') return false;

  const root = value as Record<string, unknown>;
  const lesson = root.lesson;
  const scenes = root.scenes;

  if (!lesson || typeof lesson !== 'object' || !Array.isArray(scenes)) return false;

  const lessonRecord = lesson as Record<string, unknown>;
  if (
    typeof lessonRecord.title !== 'string' ||
    typeof lessonRecord.topic !== 'string' ||
    typeof lessonRecord.level !== 'string' ||
    typeof lessonRecord.targetLanguage !== 'string' ||
    typeof lessonRecord.explanationLanguage !== 'string'
  ) {
    return false;
  }

  return scenes.every((scene) => {
    if (!scene || typeof scene !== 'object') return false;

    const item = scene as Record<string, unknown>;
    return (
      typeof item.id === 'string' &&
      typeof item.type === 'string' &&
      typeof item.duration === 'number' &&
      item.duration > 0 &&
      Number.isFinite(item.duration) &&
      !!item.audio &&
      typeof item.audio === 'object'
    );
  });
}

/**
 * Normalize a lesson JSON scene ID so IDs stay stable across
 * regeneration/reordering and remain safe as engine cache keys.
 */
export function normalizeSceneId(id: string, index: number): string {
  const normalized = id.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
  return normalized || `scene_${String(index + 1).padStart(3, '0')}`;
}
