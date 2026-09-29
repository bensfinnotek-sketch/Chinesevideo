import { LessonScene } from '../../types/lesson';
import { VisualStyle } from '../../types/visual';

/**
 * Visual Prompt Builder
 * Tuân thủ nghiêm ngặt các quy tắc:
 * 1. Chỉ tạo: background, character, environment, action, cinematic B-roll, educational illustration.
 * 2. Phong cách: warm educational animation, clean Chinese modern classroom, soft lighting, friendly characters, subtle camera movement.
 * 3. Tuyệt đối KHÔNG chứa chữ (text, letters, hanzi, subtitles, watermark) vì text được renderer của app xử lý.
 */

export function buildSmartVisualPrompt(
  scene: LessonScene,
  style: VisualStyle = 'warm_educational_animation',
  aspectRatio: '16:9' | '9:16' = '16:9'
): string {
  // Nếu scene đã có sẵn visualPrompt tùy biến từ AI lesson script và hợp lệ
  const basePrompt = scene.visualPrompt && scene.visualPrompt.trim().length > 10
    ? scene.visualPrompt
    : getDefaultPromptForSceneType(scene);

  const styleDescriptor = getStyleDescriptor(style);
  const ratioNote = aspectRatio === '16:9' ? 'cinematic 16:9 widescreen composition' : 'vertical 9:16 portrait composition';

  // Negative prompt nghiêm ngặt để AI không render chữ hay phụ đề
  const negativeConstraints = 'CRITICAL REQUIREMENT: Absolutely NO TEXT, NO LETTERS, NO NUMBERS, NO CHINESE CHARACTERS, NO HANZI, NO SUBTITLES, NO WATERMARK, NO UI OVERLAYS. Pure visual environment and character illustration only.';

  return `${basePrompt}. ${styleDescriptor}, ${ratioNote}, peaceful cozy atmosphere, soft warm natural lighting, high quality animation art. ${negativeConstraints}`;
}

function getDefaultPromptForSceneType(scene: LessonScene): string {
  const chinese = scene.chineseText || '';
  const words = (scene.highlightWords || []).join(' ');

  // Kiểm tra ngữ cảnh thi cử / ôn tập (ví dụ trong prompt của người dùng)
  if (/考试|期中|复习|紧张|测验/.test(chinese) || /考试|期中|复习|紧张/.test(words)) {
    return 'A young Chinese university student sitting at a clean wooden desk inside a bright sunny modern classroom, looking down at an exam paper with a thoughtful focused expression, holding a pen, soft morning sunlight casting gentle shadows, clean classroom background with large glass windows and green trees outside';
  }

  // Phân bổ theo loại Scene
  switch (scene.type) {
    case 'intro':
      return 'A welcoming bright modern Chinese university classroom, a friendly approachable female teacher standing near a wooden podium with a warm gentle smile, morning sunlight beaming through floor-to-ceiling windows, potted plants, clean educational aesthetic';

    case 'dialogue':
      return 'Two friendly Chinese university students, a female student and a male student, having a lively pleasant conversation at a wooden table in a cozy campus cafe, holding warm drinks and notebooks, soft golden hour lighting, blurred campus background';

    case 'sentence_breakdown':
      return 'A quiet cozy aesthetic study desk with open hardcover notebooks, a ceramic coffee cup with gentle steam, a stylish minimalist desk lamp illuminating the wooden surface, soft depth of field, calm academic B-roll';

    case 'word_highlight':
      return 'Cinematic macro close-up of stationery on a wooden desk, a fine-tip fountain pen resting beside an art book, warm golden morning light streaming across the scene, cinematic bokeh';

    case 'grammar_usage':
      return 'A bright modern university library interior, tall wooden bookshelves filled with books, a student walking softly in the background, peaceful study ambiance, soft ambient lighting';

    case 'new_examples':
      return 'Two young friends walking side-by-side along a tree-lined university campus path in Beijing, holding study folders, smiling warmly, autumn leaves gently falling, soft cinematic sunlight';

    case 'listening_drill':
      return 'A friendly Asian student wearing sleek over-ear headphones, sitting near a library window, listening attentively with a relaxed serene smile, soft blurred background of bookshelves and soft daylight';

    case 'review_summary':
      return 'A picturesque view of a modern university campus during golden hour sunset, students strolling peacefully across the green courtyard, warm inspiring glowing sky, joyful encouraging atmosphere';

    default:
      return 'A warm clean Chinese educational scene, friendly characters, modern classroom setting, soft warm lighting, cinematic depth';
  }
}

function getStyleDescriptor(style: VisualStyle): string {
  switch (style) {
    case 'warm_educational_animation':
      return 'Warm educational animation style, Makoto Shinkai and Ghibli inspired anime aesthetic, hand-drawn warmth, vibrant yet soft pastel color palette, clean lines';
    case 'clean_chinese_classroom':
      return 'Clean modern Chinese classroom aesthetic, contemporary minimalist interior design, bright natural daylight, crisp architectural lines, serene and tidy';
    case 'cinematic_broll':
      return 'Cinematic 4K B-roll footage aesthetic, 35mm lens, subtle film grain, natural dynamic range, shallow depth of field, authentic lifestyle documentary feel';
    case 'cozy_campus_lifestyle':
      return 'Cozy campus lifestyle illustration, warm honey and cream tones, soft ambient glow, relatable college atmosphere, joyful youthful energy';
    default:
      return 'Warm educational animation aesthetic, soft lighting, friendly characters';
  }
}
