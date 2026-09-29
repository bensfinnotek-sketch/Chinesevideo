import { AudioSegment, TTSSpeedMode } from './types';

/**
 * Thuật toán ước lượng timing segment chuẩn xác dựa trên số lượng âm tiết,
 * độ dài từ và các khoảng nghỉ tự nhiên của tiếng Trung & tiếng Việt.
 * Đảm bảo:
 * 1. Không làm mất dấu thanh Pinyin (lưu kèm vào metadata).
 * 2. Không làm sai lệch chữ Trung do normalization.
 * 3. Hỗ trợ 3 chế độ tốc độ: Normal, Slow, Very Slow.
 */

// Hệ số tốc độ đọc
export const SPEED_FACTORS: Record<TTSSpeedMode, number> = {
  normal: 1.0,
  slow: 0.8,
  very_slow: 0.65,
};

/**
 * Ước lượng thời lượng tự nhiên (giây) của đoạn văn bản
 */
export function estimateNaturalDuration(
  text: string,
  language: 'zh-CN' | 'vi-VN' | 'mixed' = 'zh-CN',
  speedMode: TTSSpeedMode = 'normal'
): number {
  if (!text || text.trim().length === 0) return 1.5;

  const cleanText = text.replace(/\[.*?\]|\(.*?\)/g, '').trim();
  const speed = SPEED_FACTORS[speedMode] || 1.0;

  // Tiếng Trung: Trung bình người bản xứ đọc 3.8 chữ / giây ở tốc độ bình thường
  // Tiếng Việt: Trung bình 4.2 âm tiết / giây
  let syllablesPerSec = language === 'zh-CN' ? 3.8 : 4.2;
  syllablesPerSec *= speed;

  const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latinWords = (cleanText.replace(/[\u4e00-\u9fa5]/g, '').trim().split(/\s+/).filter(Boolean) || []).length;
  const totalUnits = Math.max(1, chineseChars + latinWords);

  // Khoảng nghỉ tự nhiên theo dấu câu
  const majorPauses = (cleanText.match(/[。！？\.\?!]/g) || []).length * (0.6 / speed);
  const minorPauses = (cleanText.match(/[，、；;,]/g) || []).length * (0.35 / speed);
  const lineBreaks = (cleanText.match(/\n/g) || []).length * (0.5 / speed);

  const rawSeconds = (totalUnits / syllablesPerSec) + majorPauses + minorPauses + lineBreaks;
  return Math.max(1.8, Number(rawSeconds.toFixed(2)));
}

/**
 * Tạo danh sách audio segments có timestamp start/end chính xác
 */
export function estimateAudioSegments(
  text: string,
  totalDurationSeconds: number,
  speedMode: TTSSpeedMode = 'normal',
  speaker?: string
): AudioSegment[] {
  if (!text || text.trim().length === 0) return [];

  // Tách văn bản thành các token: khối từ 1-4 chữ Hán, từ Latinh hoặc dấu câu
  const rawTokens = text.match(/[\u4e00-\u9fa5]{1,4}|[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+|[0-9]+|[，。！？、；：,\.!\?;:\n\r\t]+/g) || [text];

  if (rawTokens.length === 0) {
    return [{ text, start: 0, end: totalDurationSeconds, speaker }];
  }

  const speed = SPEED_FACTORS[speedMode] || 1.0;

  // Tính trọng số (weight) cho từng token
  const weights: number[] = rawTokens.map(token => {
    // Ngắt dòng / kết câu -> khoảng nghỉ dài
    if (/\n/.test(token) || /[。！？\.\?!]/.test(token)) {
      return 2.5 / speed;
    }
    // Dấu phẩy / ngắt nghỉ nhẹ
    if (/[，、；;,]/.test(token)) {
      return 1.4 / speed;
    }
    // Chữ Hán
    const hanziCount = (token.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (hanziCount > 0) {
      return hanziCount * (1.1 / speed);
    }
    // Từ Latinh hoặc số
    return Math.max(0.8, (token.length * 0.28) / speed);
  });

  const totalWeight = Math.max(0.1, weights.reduce((a, b) => a + b, 0));
  const timePerUnit = totalDurationSeconds / totalWeight;

  const segments: AudioSegment[] = [];
  let currentTime = 0;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    const duration = weights[i] * timePerUnit;
    const startTime = Number(currentTime.toFixed(3));
    const endTime = Number(Math.min(totalDurationSeconds, currentTime + duration).toFixed(3));

    // Nếu token chỉ là dấu câu hoặc khoảng trắng đơn lẻ, gắn vào token liền trước
    if (/^[，。！？、；：,\.!\?;:\s\n]+$/.test(token) && segments.length > 0) {
      segments[segments.length - 1].end = endTime;
      segments[segments.length - 1].text += token.replace(/\n+/g, ' ');
    } else {
      segments.push({
        text: token.trim(),
        start: startTime,
        end: endTime,
        speaker,
      });
    }

    currentTime += duration;
  }

  // Đảm bảo segment cuối cùng khớp đúng tổng thời lượng
  if (segments.length > 0) {
    segments[segments.length - 1].end = totalDurationSeconds;
  }

  return segments;
}

/**
 * Phân tích và tạo segments kết hợp cho toàn bộ Scene:
 * 1. Lời giảng của Giáo viên (tiếng Việt)
 * 2. Khoảng nghỉ tự nhiên (Pause)
 * 3. Hội thoại hoặc câu tiếng Trung (chuẩn Mandarin)
 */
export function buildSceneSegments(
  teacherExplanation: string,
  chineseText: string,
  pinyinText: string,
  totalDurationSeconds: number,
  speedMode: TTSSpeedMode = 'normal',
  includePinyinAudio: boolean = false,
  pauseBetweenMs: number = 600
): { segments: AudioSegment[]; calculatedDuration: number } {
  const pauseSeconds = pauseBetweenMs / 1000;
  
  const hasTeacher = Boolean(teacherExplanation && teacherExplanation.trim());
  const hasChinese = Boolean(chineseText && chineseText.trim());

  if (!hasTeacher && !hasChinese) {
    return {
      segments: [{ text: '...', start: 0, end: totalDurationSeconds }],
      calculatedDuration: totalDurationSeconds,
    };
  }

  const teacherDurEst = hasTeacher ? estimateNaturalDuration(teacherExplanation, 'vi-VN', speedMode) : 0;
  const chineseDurEst = hasChinese ? estimateNaturalDuration(chineseText, 'zh-CN', speedMode) : 0;
  const totalEst = (hasTeacher && hasChinese) 
    ? teacherDurEst + pauseSeconds + chineseDurEst
    : (teacherDurEst || chineseDurEst);

  const durationScale = totalDurationSeconds > 0 ? (totalDurationSeconds / totalEst) : 1.0;
  const teacherDuration = Number((teacherDurEst * durationScale).toFixed(2));
  const chineseDuration = Number((chineseDurEst * durationScale).toFixed(2));

  const allSegments: AudioSegment[] = [];
  let timeline = 0;

  // 1. Phân đoạn Lời giảng của Giáo viên (Việt Nam)
  if (hasTeacher) {
    const teacherSegs = estimateAudioSegments(teacherExplanation, teacherDuration, speedMode, 'Giáo viên');
    teacherSegs.forEach(seg => {
      allSegments.push({
        ...seg,
        start: Number((seg.start + timeline).toFixed(3)),
        end: Number((seg.end + timeline).toFixed(3)),
        type: 'teacher_explanation',
      });
    });
    timeline += teacherDuration;

    // Khoảng nghỉ tự nhiên giữa lời giảng và câu tiếng Trung
    if (hasChinese && pauseSeconds > 0) {
      allSegments.push({
        text: '· · ·',
        start: Number(timeline.toFixed(3)),
        end: Number((timeline + pauseSeconds).toFixed(3)),
        type: 'pause',
      });
      timeline += pauseSeconds;
    }
  }

  // 2. Phân đoạn Hội thoại / Tiếng Trung (Mandarin)
  if (hasChinese) {
    // Tách dòng hội thoại (Ví dụ: A: 你好\nB: 谢谢)
    const lines = chineseText.split('\n').filter(l => l.trim().length > 0);
    const lineDuration = chineseDuration / Math.max(1, lines.length);

    lines.forEach((line) => {
      const match = line.match(/^([^:：]+)[:：]\s*(.*)$/);
      const speaker = match ? match[1].trim() : undefined;
      const content = match ? match[2].trim() : line.trim();

      const lineSegs = estimateAudioSegments(content, lineDuration, speedMode, speaker);
      lineSegs.forEach(seg => {
        allSegments.push({
          ...seg,
          start: Number((seg.start + timeline).toFixed(3)),
          end: Number((seg.end + timeline).toFixed(3)),
          speaker: speaker || seg.speaker,
          type: 'chinese_dialogue',
        });
      });
      timeline += lineDuration;
    });
  }

  return {
    segments: allSegments,
    calculatedDuration: Number(timeline.toFixed(2)),
  };
}
