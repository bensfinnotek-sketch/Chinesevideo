import { VocabItem, LessonDurationTarget, GeneratedLessonPlan } from '../types/lesson';

/**
 * Tính toán số lượng từ tối ưu cho mỗi video bài giảng dựa theo thời lượng mục tiêu
 * - 3 phút: 2 - 3 từ
 * - 5 phút: 4 - 5 từ (khuyên dùng)
 * - 10 phút: 6 - 8 từ
 * - 15 phút: 9 - 12 từ
 */
export function getRecommendedWordsPerLesson(durationMinutes: LessonDurationTarget): number {
  switch (durationMinutes) {
    case 3:
      return 3;
    case 5:
      return 5;
    case 10:
      return 8;
    case 15:
      return 12;
    default:
      return 5;
  }
}

export interface LessonChunk {
  lessonIndex: number;
  totalLessons: number;
  items: VocabItem[];
  suggestedTitle: string;
}

/**
 * Tự động phân chia danh sách từ vựng thành các bài giảng vừa vặn, không nhồi nhét
 */
export function partitionVocabIntoLessons(
  items: VocabItem[],
  durationMinutes: LessonDurationTarget
): LessonChunk[] {
  if (!items || items.length === 0) return [];

  const wordsPerLesson = getRecommendedWordsPerLesson(durationMinutes);
  const totalLessons = Math.ceil(items.length / wordsPerLesson);
  const chunks: LessonChunk[] = [];

  for (let i = 0; i < totalLessons; i++) {
    const chunkItems = items.slice(i * wordsPerLesson, (i + 1) * wordsPerLesson);
    const mainWords = chunkItems.slice(0, 3).map(c => c.chinese).join(' · ');
    chunks.push({
      lessonIndex: i + 1,
      totalLessons,
      items: chunkItems,
      suggestedTitle: `Bài ${i + 1}: ${mainWords || 'Giao tiếp tiếng Trung'}`,
    });
  }

  return chunks;
}

/**
 * Gọi API backend để Gemini viết kịch bản sư phạm 8 SCENES hoàn chỉnh
 */
export async function requestLessonScript(
  vocabItems: VocabItem[],
  targetDurationMinutes: LessonDurationTarget,
  lessonTitle?: string,
  lessonIndex: number = 1,
  totalLessons: number = 1
): Promise<GeneratedLessonPlan> {
  const response = await fetch('/api/ai/generate-lesson-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vocabItems,
      targetDurationMinutes,
      lessonTitle,
      lessonIndex,
      totalLessons,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lỗi khi tạo kịch bản: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || !data.plan) {
    throw new Error('Dữ liệu kịch bản trả về không hợp lệ.');
  }

  return data.plan as GeneratedLessonPlan;
}
