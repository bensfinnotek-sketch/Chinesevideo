/**
 * Dialogue Parser Service
 * Phân tích các khối văn bản hội thoại đa dòng thành các lượt thoại (Dialogue Turns)
 * chuẩn cấu trúc 3 dòng:
 * Dòng 1: Tên nhân vật: + Chinese
 * Dòng 2: Pinyin
 * Dòng 3: Nghĩa tiếng Việt
 */

export interface WordToken {
  text: string;
  isHighlight: boolean;
  index: number;
}

export interface DialogueTurn {
  id: string;
  characterName: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
  tokens: WordToken[];
}

/**
 * Tách một chuỗi tiếng Trung thành các token từ vựng dựa trên danh sách highlightWords
 */
export function tokenizeChineseText(text: string, highlightWords: string[] = []): WordToken[] {
  if (!text) return [];

  // Chuẩn hóa danh sách từ khóa highlight
  const validKeywords = highlightWords.filter(k => k && k.trim().length > 0);
  
  if (validKeywords.length === 0) {
    // Nếu không có keyword cụ thể, tách theo dấu câu hoặc từng cụm 1-2 chữ Hán
    const segments = text.split(/([，。！？、；：\s]+)/);
    let tokenIndex = 0;
    return segments
      .filter(s => s.length > 0)
      .map(seg => ({
        text: seg,
        isHighlight: false,
        index: tokenIndex++
      }));
  }

  // Tạo Regex tìm các keywords
  const escaped = validKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'g');

  const parts = text.split(regex);
  let tokenIdx = 0;

  return parts
    .filter(p => p.length > 0)
    .map(part => {
      const isHl = validKeywords.includes(part);
      return {
        text: part,
        isHighlight: isHl,
        index: tokenIdx++
      };
    });
}

/**
 * Trích xuất tên nhân vật từ đầu dòng (ví dụ: "高峰：...", "A: ...", "Tiểu Minh: ...")
 */
function extractSpeakerAndText(line: string): { speaker: string; content: string } {
  const match = line.match(/^([^:：]{1,15})[:：]\s*(.*)$/);
  if (match) {
    return {
      speaker: match[1].trim(),
      content: match[2].trim()
    };
  }
  return {
    speaker: '',
    content: line.trim()
  };
}

/**
 * Phân tích văn bản 3 phần (chineseText, pinyin, vietnamese) thành danh sách lượt thoại chuẩn
 */
export function parseDialogueTurns(
  chineseText: string,
  pinyin: string,
  vietnamese: string,
  highlightWords: string[] = []
): DialogueTurn[] {
  if (!chineseText) return [];

  const cLines = chineseText.split('\n').map(l => l.trim()).filter(Boolean);
  const pLines = pinyin ? pinyin.split('\n').map(l => l.trim()).filter(Boolean) : [];
  const vLines = vietnamese ? vietnamese.split('\n').map(l => l.trim()).filter(Boolean) : [];

  const turns: DialogueTurn[] = [];

  for (let i = 0; i < cLines.length; i++) {
    const rawC = cLines[i];
    const rawP = pLines[i] || '';
    const rawV = vLines[i] || '';

    const parsedC = extractSpeakerAndText(rawC);
    const parsedP = extractSpeakerAndText(rawP);
    const parsedV = extractSpeakerAndText(rawV);

    const characterName = parsedC.speaker || parsedP.speaker || parsedV.speaker || (cLines.length > 1 ? `Nhân vật ${String.fromCharCode(65 + (i % 2))}` : '');
    const cleanChinese = parsedC.speaker ? parsedC.content : rawC;
    const cleanPinyin = parsedP.speaker ? parsedP.content : rawP;
    const cleanVietnamese = parsedV.speaker ? parsedV.content : rawV;

    const tokens = tokenizeChineseText(cleanChinese, highlightWords);

    turns.push({
      id: `turn-${i}`,
      characterName,
      chinese: cleanChinese,
      pinyin: cleanPinyin,
      vietnamese: cleanVietnamese,
      tokens
    });
  }

  return turns;
}
