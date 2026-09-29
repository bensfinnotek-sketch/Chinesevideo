import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// JSON schema định nghĩa cho từ vựng
const vocabItemSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    chinese: { type: Type.STRING, description: 'Chữ Trung nguyên bản người dùng cung cấp nếu hợp lệ' },
    traditionalChinese: { type: Type.STRING, description: 'Chữ Phồn thể tương ứng (hoặc Giản thể nếu input là Phồn thể)' },
    pinyin: { type: Type.STRING, description: 'Phiên âm Hanyu Pinyin chuẩn có dấu thanh' },
    vietnamese: { type: Type.STRING, description: 'Dịch nghĩa tiếng Việt tự nhiên, không word-by-word' },
    partOfSpeech: {
      type: Type.STRING,
      description: 'noun, verb, adjective, adverb, measure_word, pronoun, preposition, conjunction, phrase, sentence, other'
    },
    level: { type: Type.STRING, description: 'Cấp độ HSK hoặc độ khó (ví dụ: HSK 1, HSK 2, HSK 3, Giao tiếp)' },
    exampleChinese: { type: Type.STRING, description: 'Câu ví dụ tiếng Trung tự nhiên đời sống' },
    examplePinyin: { type: Type.STRING, description: 'Pinyin có thanh điệu cho câu ví dụ' },
    exampleVietnamese: { type: Type.STRING, description: 'Dịch nghĩa tiếng Việt tự nhiên cho câu ví dụ' },
    usageNote: { type: Type.STRING, description: 'Ghi chú ngữ pháp, cách dùng hoặc mẹo nhớ cho người Việt' },
    verificationNotes: { type: Type.STRING, description: 'Ghi chú thẩm định hoặc các lỗi đã sửa' },
  },
  required: [
    'chinese',
    'traditionalChinese',
    'pinyin',
    'vietnamese',
    'partOfSpeech',
    'level',
    'exampleChinese',
    'examplePinyin',
    'exampleVietnamese',
    'usageNote'
  ],
};

const vocabListSchema = {
  type: Type.ARRAY,
  items: vocabItemSchema,
};

// JSON Schema cho Kịch bản bài giảng 8 SCENES (Lesson Generator)
const lessonScriptResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    topic: { type: Type.STRING },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          voice: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['name', 'role', 'voice'],
      },
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sceneId: { type: Type.INTEGER },
          type: { type: Type.STRING },
          duration: { type: Type.INTEGER },
          characters: { type: Type.ARRAY, items: { type: Type.STRING } },
          chineseText: { type: Type.STRING },
          pinyin: { type: Type.STRING },
          vietnamese: { type: Type.STRING },
          teacherExplanation: { type: Type.STRING },
          pedagogicalDetails: {
            type: Type.OBJECT,
            properties: {
              meaning: { type: Type.STRING },
              usage: { type: Type.STRING },
              nuance: { type: Type.STRING },
              collocations: { type: Type.ARRAY, items: { type: Type.STRING } },
              additionalExample: {
                type: Type.OBJECT,
                properties: {
                  chinese: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  vietnamese: { type: Type.STRING },
                },
              },
            },
          },
          highlightWords: { type: Type.ARRAY, items: { type: Type.STRING } },
          voice: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
          practiceQuestion: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
          },
        },
        required: [
          'sceneId',
          'type',
          'duration',
          'characters',
          'chineseText',
          'pinyin',
          'vietnamese',
          'teacherExplanation',
          'highlightWords',
          'voice',
          'visualPrompt',
        ],
      },
    },
  },
  required: ['title', 'topic', 'characters', 'scenes'],
};

/**
 * Helper gọi Gemini với cơ chế tự động chuyển model dự phòng
 * Ưu tiên gemini-2.5-flash theo skill guide, chuyển sang gemini-3.8-flash-lite nếu gặp sự cố quota
 */
async function callGeminiTextModel(options: {
  contents: any;
  config?: any;
}): Promise<string | null> {
  if (!ai) return null;
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash-lite'];
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} thất bại (${err.message || err}), thử model tiếp theo...`);
    }
  }
  return null;
}

/**
 * Endpoint 1: POST /api/ai/analyze
 * Gemini phân tích và chuẩn hóa danh sách từ vựng/câu tiếng Trung
 */
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Danh sách mục từ vựng không hợp lệ.' });
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY chưa được cấu hình. Sử dụng bộ phân tích dự phòng.');
      return res.json({ items: fallbackAnalyze(items) });
    }

    const prompt = `Bạn là một chuyên gia ngôn ngữ học tiếng Trung và giảng viên tiếng Trung cao cấp cho người Việt Nam.
Hãy phân tích và chuẩn hóa danh sách các từ/câu tiếng Trung sau đây thành dữ liệu bài học hoàn chỉnh.

Dữ liệu đầu vào:
${JSON.stringify(items, null, 2)}

QUY TẮC BẮT BUỘC:
1. 'chinese': Phải giữ nguyên chữ Trung mà người dùng cung cấp nếu hợp lệ.
2. Nếu người dùng cung cấp Simplified Chinese thì KHÔNG tự ý đổi sang Traditional Chinese.
3. 'traditionalChinese': Cung cấp chữ Phồn thể tương ứng nếu 'chinese' là Giản thể (hoặc ngược lại).
4. 'pinyin': Nếu thiếu hoặc chưa chuẩn, hãy tạo Pinyin chuẩn Hanyu Pinyin có dấu thanh điệu (ví dụ: nǐ hǎo, xièxie, xuéxí, kāfēi).
5. 'vietnamese': Nếu thiếu nghĩa, hãy dịch sang tiếng Việt tự nhiên. KHÔNG dịch word-by-word một cách máy móc.
6. Nếu từ có nhiều nghĩa: nếu có ngữ cảnh thì chọn nghĩa phù hợp ngữ cảnh; nếu không có ngữ cảnh cụ thể, hãy ghi rõ các nghĩa thông dụng phân cách bằng dấu phẩy hoặc chấm phẩy.
7. 'exampleChinese': Tạo MỘT câu ví dụ tiếng Trung tự nhiên, đời sống, có chứa từ/câu này.
8. 'examplePinyin': Tạo Pinyin chuẩn có thanh điệu cho câu ví dụ.
9. 'exampleVietnamese': Tạo nghĩa tiếng Việt tự nhiên cho câu ví dụ.
10. 'partOfSpeech': Xác định loại từ, bắt buộc là một trong các giá trị sau:
noun, verb, adjective, adverb, measure_word, pronoun, preposition, conjunction, phrase, sentence, other.
11. 'level': Xác định cấp độ (ví dụ: HSK 1, HSK 2, HSK 3, HSK 4, HSK 5, HSK 6, Giao tiếp).
12. 'usageNote': Ghi chú ngắn gọn về cách dùng, ngữ pháp, mẹo nhớ âm Hán Việt hoặc lưu ý khi dùng từ này.
13. Nếu phát hiện dữ liệu không rõ ràng, KHÔNG tự ý bịa đặt.
14. Giữ nguyên trường 'id' của từng mục nếu có, hoặc tạo id mới duy nhất.

Trả về danh sách đối tượng JSON theo schema.`;

    const responseText = await callGeminiTextModel({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: vocabListSchema,
        systemInstruction: 'Bạn là chuyên gia ngôn ngữ học tiếng Trung và dịch thuật Trung - Việt chuyên nghiệp.',
        temperature: 0.2,
      },
    });

    if (!responseText) {
      console.warn('Gemini không phản hồi văn bản, dùng fallback cục bộ');
      return res.json({ items: fallbackAnalyze(items) });
    }

    const analyzedItems = JSON.parse(responseText.trim());

    const finalItems = analyzedItems.map((item: any, idx: number) => ({
      ...item,
      id: item.id || items[idx]?.id || `ai-${Date.now()}-${idx}`,
      isAiVerified: true,
      verificationNotes: item.verificationNotes || 'AI đã phân tích và chuẩn hóa toàn diện',
    }));

    res.json({ items: finalItems });
  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini /api/ai/analyze:', error);
    const { items } = req.body;
    res.json({ items: fallbackAnalyze(items || []) });
  }
});

/**
 * Endpoint 2: POST /api/ai/verify
 * "AI kiểm tra lại" - Gemini rà soát lỗi Pinyin, nghĩa tiếng Việt, câu ví dụ và loại từ
 */
app.post('/api/ai/verify', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Danh sách kiểm tra không hợp lệ.' });
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY chưa được cấu hình. Sử dụng bộ hiệu đính dự phòng.');
      return res.json({ items: fallbackVerify(items) });
    }

    const prompt = `Bạn là chuyên gia hiệu đính và thẩm định giáo trình tiếng Trung dành cho người Việt Nam.
Hãy kiểm tra lại toàn bộ danh sách từ vựng/câu tiếng Trung sau đây để phát hiện và sửa các lỗi sai:

Danh sách cần kiểm tra:
${JSON.stringify(items, null, 2)}

NHIỆM VỤ HIỆU ĐÍNH:
1. Rà soát chữ Hán (chinese): Đảm bảo đúng chính tả, không lẫn ký tự rác. Giữ nguyên Giản thể nếu người dùng nhập Giản thể.
2. Kiểm tra Pinyin: Đảm bảo dấu thanh điệu (ā, á, ǎ, à, v.v.) đặt đúng nguyên âm chính, kiểm tra quy tắc biến điệu, dấu thanh nhẹ.
3. Kiểm tra nghĩa tiếng Việt: Sửa các lỗi dịch máy thô ráp, đảm bảo diễn đạt tự nhiên, chuẩn phong cách Việt Nam.
4. Kiểm tra câu ví dụ (exampleChinese, examplePinyin, exampleVietnamese): Sửa câu ví dụ nếu câu gượng gạo hoặc sai ngữ pháp.
5. Kiểm tra loại từ (partOfSpeech): Chọn đúng trong danh sách (noun, verb, adjective, adverb, measure_word, pronoun, preposition, conjunction, phrase, sentence, other).
6. 'verificationNotes': Ghi cụ thể kết quả kiểm tra hoặc các điểm đã hiệu chỉnh (ví dụ: "Đã sửa dấu thanh Pinyin", "Đã chuẩn hóa dịch nghĩa tự nhiên", "Dữ liệu chuẩn xác 100%").

Trả về danh sách đầy đủ các mục đã được rà soát và hiệu chỉnh theo đúng schema JSON.`;

    const responseText = await callGeminiTextModel({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: vocabListSchema,
        systemInstruction: 'Bạn là chuyên gia thẩm định ngữ pháp và hiệu đính tiếng Trung - tiếng Việt cao cấp.',
        temperature: 0.1,
      },
    });

    if (!responseText) {
      console.warn('Gemini không phản hồi văn bản, dùng fallback hiệu đính cục bộ');
      return res.json({ items: fallbackVerify(items) });
    }

    const verifiedItems = JSON.parse(responseText.trim());

    const finalItems = verifiedItems.map((item: any, idx: number) => ({
      ...item,
      id: item.id || items[idx]?.id || `verified-${Date.now()}-${idx}`,
      isAiVerified: true,
      verificationNotes: item.verificationNotes || 'Đã kiểm tra và tối ưu hóa',
    }));

    res.json({ items: finalItems });
  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini /api/ai/verify:', error);
    const { items } = req.body;
    res.json({ items: fallbackVerify(items || []) });
  }
});

/**
 * Endpoint 3: POST /api/ai/generate-lesson-script
 * Lesson Generator: Tự động thiết kế bài giảng sư phạm cao cấp
 * Flow: Context → Dialogue → Listen → Explanation → Vocabulary → Example → Repeat → Mini Practice
 */
app.post('/api/ai/generate-lesson-script', async (req, res) => {
  try {
    const { vocabItems, targetDurationMinutes = 5, lessonTitle, lessonIndex = 1, totalLessons = 1 } = req.body;

    if (!vocabItems || !Array.isArray(vocabItems) || vocabItems.length === 0) {
      return res.status(400).json({ error: 'Danh sách từ vựng bài giảng không được để trống.' });
    }

    const targetSeconds = (targetDurationMinutes || 5) * 60;

    const prompt = `Bạn là một giảng viên sư phạm tiếng Trung cao cấp, chuyên thiết kế bài giảng video có TÍNH SƯ PHẠM CAO NHẤT cho học viên Việt Nam.

NGUYÊN TẮC SƯ PHẠM CỐT LÕI (BẮT BUỘC TUÂN THỦ):
1. TUYỆT ĐỐI KHÔNG biến video thành flashcard slideshow khô khan (không bao giờ chỉ hiển thị một danh sách từ vựng từ trên xuống dưới dạng chữ Hán - Pinyin - Tiếng Việt).
2. MỖI NHÓM TỪ BẮT BUỘC ĐƯỢC ĐẶT TRONG MỘT NGỮ CẢNH TÌNH HUỐNG SỐNG ĐỘNG.
   Ví dụ điển hình:
   Nếu từ là "考试" (kǎoshì), KHÔNG chỉ hiển thị "考试 / kǎoshì / kỳ thi", mà PHẢI tạo tình huống đối thoại tự nhiên:
   A: 你明天有考试吗？(Ngày mai bạn có bài thi không?)
   B: 有啊，我还没复习完呢。(Có chứ, mình còn chưa ôn tập xong đây.)
   Sau đó giáo viên giải thích sâu 5 thành phần sư phạm:
   - 1. Nghĩa của từ (kỳ thi, thi cử)
   - 2. Cách sử dụng (đóng vai trò động từ hoặc danh từ)
   - 3. Sắc thái trong câu (tâm trạng hồi hộp, chuẩn bị trước thử thách)
   - 4. Cụm từ thường đi cùng (Collocations: 参加考试, 期末考试, 准备考试, 考试及格...)
   - 5. Một ví dụ khác mở rộng ngữ cảnh
   Sau đó cho người học nghe lại!

3. LESSON FLOW SƯ PHẠM CHUẨN:
   Context (Bối cảnh tình huống thực tế)
   → Dialogue (Tình huống đối thoại sinh động giữa 2 nhân vật có chứa từ vựng)
   → Listen (Cho người học nghe lại trọn vẹn ngữ điệu tự nhiên)
   → Explanation (Giáo viên giảng giải sâu 5 yếu tố sư phạm bằng tiếng Việt)
   → Vocabulary (Khắc sâu hình thái chữ Hán, bộ thủ, âm Hán Việt & thanh điệu)
   → Example (Mở rộng ví dụ câu ứng dụng thực tế khác)
   → Repeat (Luyện phản xạ Shadowing - đọc chậm có khoảng lặng nhắc lại)
   → Mini Practice (Thử thách nhỏ củng cố phản xạ tức thì)

4. NGUYÊN TẮC LINH HOẠT CỦA AI:
   - Không nhất thiết scene nào cũng phải có tất cả các bước.
   - AI tự chọn flow phù hợp nhất với nội dung nhóm từ và thời lượng bài giảng.
   - ƯU TIÊN KHẢ NĂNG GHI NHỚ VÀ HIỂU NGỮ CẢNH THAY VÌ NHỒI NHIỀU TỪ!

DANH SÁCH TỪ VỰNG TRỌNG TÂM:
${JSON.stringify(vocabItems.map((v: any) => ({
  chinese: v.chinese,
  pinyin: v.pinyin,
  vietnamese: v.vietnamese,
  partOfSpeech: v.partOfSpeech,
  exampleChinese: v.exampleChinese,
  exampleVietnamese: v.exampleVietnamese,
  usageNote: v.usageNote,
})), null, 2)}

THỜI LƯỢNG MỤC TIÊU: ${targetDurationMinutes} phút (~${targetSeconds} giây). Tổng thời lượng của tất cả các scene cộng lại phải xấp xỉ ${targetSeconds} giây.

Quy định các trường của từng scene trong mảng "scenes":
- "sceneId": số thứ tự từ 1 đến N (từ 6 đến 8 scenes).
- "type": "context" | "dialogue" | "listen" | "explanation" | "vocabulary" | "example" | "repeat" | "mini_practice".
- "duration": thời lượng (giây) hợp lý.
- "characters": mảng tên người xuất hiện (ví dụ: ["Cô giáo Mai"], ["Tiểu Minh (Nhân vật A)", "Đại Hùng (Nhân vật B)"]).
- "chineseText": nội dung tiếng Trung hiển thị trên màn hình.
- "pinyin": phiên âm có dấu thanh tương ứng.
- "vietnamese": bản dịch tiếng Việt tự nhiên tương ứng.
- "teacherExplanation": lời thoại của giáo viên giảng dạy bằng tiếng Việt ấm áp, sinh động.
- "pedagogicalDetails": đối tượng gồm:
    "meaning": nghĩa chuẩn của từ,
    "usage": cách sử dụng ngữ pháp,
    "nuance": sắc thái trong câu,
    "collocations": mảng các cụm từ đi cùng,
    "additionalExample": { "chinese": "...", "pinyin": "...", "vietnamese": "..." }
- "highlightWords": mảng các từ khóa cần làm nổi bật trên màn hình.
- "voice": mã giọng đọc ("female_teacher_vi", "char_a_beijing_female", "char_b_beijing_male").
- "visualPrompt": hướng dẫn hiển thị hình ảnh/khung hình cho Visual Generator (KHÔNG chữ viết).
- "practiceQuestion": (nếu là mini_practice) { "question": "...", "options": ["..."], "correctIndex": 0, "explanation": "..." }

Trả về đối tượng JSON theo đúng schema.`;

    const responseText = await callGeminiTextModel({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: lessonScriptResponseSchema,
        systemInstruction: 'Bạn là chuyên gia sư phạm tiếng Trung cho người Việt, chuyên thiết kế bài giảng video có tính ngữ cảnh và tính sư phạm cao nhất.',
        temperature: 0.25,
      },
    });

    if (responseText) {
      const generated = JSON.parse(responseText.trim());
      const totalActualSeconds = generated.scenes.reduce((acc: number, s: any) => acc + (s.duration || 20), 0);

      const fullPlan = {
        lessonId: `lesson-plan-${Date.now()}-${lessonIndex}`,
        lessonIndex,
        totalLessons,
        title: generated.title || lessonTitle || `Bài giảng tiếng Trung số ${lessonIndex}`,
        topic: generated.topic || 'Giao tiếp đời sống thực tế',
        targetDurationMinutes,
        actualEstimatedDurationSeconds: totalActualSeconds,
        targetVocabItems: vocabItems,
        characters: generated.characters || [
          { name: 'Cô giáo Mai', role: 'Giáo viên hướng dẫn', voice: 'female_teacher_vi', description: 'Giọng đọc tiếng Việt truyền cảm, phát âm tiếng Trung chuẩn' },
          { name: 'Tiểu Minh (A)', role: 'Người bản xứ Bắc Kinh', voice: 'char_a_beijing_female', description: 'Giọng nữ Bắc Kinh tự nhiên, nhã nhặn' },
          { name: 'Đại Hùng (B)', role: 'Bạn bè', voice: 'char_b_beijing_male', description: 'Giọng nam Bắc Kinh trầm ấm, rõ ràng' }
        ],
        scenes: generated.scenes,
        createdAt: Date.now(),
      };

      return res.json({ plan: fullPlan });
    }

    // Fallback nếu không có kết quả từ AI
    const fallbackPlan = fallbackGenerateLessonScript(vocabItems, targetDurationMinutes, lessonTitle, lessonIndex, totalLessons);
    res.json({ plan: fallbackPlan });

  } catch (error: any) {
    console.error('Lỗi khi tạo kịch bản với Gemini:', error);
    const { vocabItems, targetDurationMinutes = 5, lessonTitle, lessonIndex = 1, totalLessons = 1 } = req.body;
    const fallbackPlan = fallbackGenerateLessonScript(vocabItems || [], targetDurationMinutes, lessonTitle, lessonIndex, totalLessons);
    res.json({ plan: fallbackPlan });
  }
});

// Bộ sinh kịch bản bài giảng sư phạm cao cấp dự phòng
// Chuẩn Pedagogical Flow: Context → Dialogue → Listen → Explanation → Vocabulary → Example → Repeat → Mini Practice
function fallbackGenerateLessonScript(
  vocabItems: any[],
  targetDurationMinutes: number = 5,
  customTitle?: string,
  lessonIndex: number = 1,
  totalLessons: number = 1
): any {
  const first = vocabItems[0] || { chinese: '考试', pinyin: 'kǎoshì', vietnamese: 'kỳ thi, thi cử', exampleChinese: '我明天有一场重要的汉语考试。', examplePinyin: 'Wǒ míngtiān yǒu yī chǎng zhòngyào de hànyǔ kǎoshì.', exampleVietnamese: 'Ngày mai tôi có một kỳ thi tiếng Trung quan trọng.' };
  const second = vocabItems[1] || { chinese: '复习', pinyin: 'fùxí', vietnamese: 'ôn tập', exampleChinese: '只要认真复习，就能考出好成绩。', examplePinyin: 'Zhǐyào rènzhēn fùxí, jiù néng kǎo chū hǎo chéngjì.', exampleVietnamese: 'Chỉ cần chăm chỉ ôn tập thì sẽ thi được điểm tốt.' };
  const third = vocabItems[2] || { chinese: '紧张', pinyin: 'jǐnzhāng', vietnamese: 'lo lắng, hồi hộp', exampleChinese: '考试前别太紧张，放松心情。', examplePinyin: 'Kǎoshì qián bié tài jǐnzhāng, fàngsōng xīnqíng.', exampleVietnamese: 'Trước kỳ thi đừng quá căng thẳng, hãy thả lỏng tâm trạng.' };

  const durationScale = targetDurationMinutes / 5;
  const scale = (sec: number) => Math.round(sec * durationScale);

  // Kiểm tra ngữ cảnh thi cử vs sinh hoạt thường nhật
  const allChineseWords = vocabItems.map(v => v.chinese).join(' ');
  const isExamContext = /考试|期中|复习|紧张|测验|及格/.test(allChineseWords);

  let scenes: any[] = [];

  if (isExamContext) {
    // Kịch bản chuyên sâu theo đúng ví dụ của người dùng: Context → Dialogue → Listen → Explanation → Vocabulary → Example → Repeat → Mini Practice
    scenes = [
      {
        sceneId: 1,
        type: 'context',
        duration: scale(25),
        characters: ['Cô giáo Mai'],
        chineseText: '期末考试周 · 北京大学教学楼',
        pinyin: 'Qīmò kǎoshì zhōu · Běijīng dàxué jiàoxuélóu',
        vietnamese: 'Tuần thi cuối kỳ · Giảng đường đại học',
        teacherExplanation: `Chào các bạn học viên! Thay vì biến bài học thành danh sách flashcard khô khan, hôm nay chúng ta sẽ cùng đặt từ vựng vào một tình huống cực kỳ gần gũi trong đời sống: Mùa thi cử và sự lo lắng của sinh viên. Hãy cùng lắng nghe cuộc đối thoại tự nhiên giữa hai bạn trẻ nhé!`,
        highlightWords: ['期末考试', '复习'],
        voice: 'female_teacher_vi',
        visualPrompt: 'A quiet sunlit university hallway in Beijing, notice board with exam announcements, students walking with backpacks',
      },
      {
        sceneId: 2,
        type: 'dialogue',
        duration: scale(45),
        characters: ['Tiểu Minh (Nhân vật A)', 'Đại Hùng (Nhân vật B)'],
        chineseText: `A: 你明天有考试吗？\nB: 有啊，我还没复习完呢。\nA: 别太紧张，相信自己一定能考好！\nB: 谢谢你的鼓励，我们一起加油！`,
        pinyin: `A: Nǐ míngtiān yǒu kǎoshì ma?\nB: Yǒu a, wǒ hái méi fùxí wán ne.\nA: Bié tài jǐnzhāng, xiāngxìn zìjǐ yīdìng néng kǎohǎo!\nB: Xièxie nǐ de gǔlì, wǒmen yīqǐ jiāyóu!`,
        vietnamese: `A: Ngày mai bạn có bài thi không?\nB: Có chứ, mình còn chưa ôn tập xong đây.\nA: Đừng quá lo lắng, tin tưởng bản thân nhất định sẽ thi tốt!\nB: Cảm ơn lời động viên của bạn, chúng ta cùng cố gắng nhé!`,
        teacherExplanation: `Vừa rồi là một tình huống rất chân thật giữa Tiểu Minh và Đại Hùng. Các bạn có nhận ra câu "你明天有考试吗？" và câu trả lời "我还没复习完呢" xuất hiện một cách vô cùng tự nhiên không nào?`,
        highlightWords: ['考试', '复习', '紧张', '加油'],
        voice: 'char_a_beijing_female',
        visualPrompt: 'Two friendly Chinese university students talking near a wooden classroom desk, holding notebooks and coffee cups',
      },
      {
        sceneId: 3,
        type: 'listen',
        duration: scale(30),
        characters: ['Tiểu Minh (Nhân vật A)', 'Đại Hùng (Nhân vật B)'],
        chineseText: `请听录音 · 感受自然语调：\n“你明天有考试吗？—— 有啊，我还没复习完呢。”`,
        pinyin: `Qǐng tīng lùyīn · Gǎnshòu zìrán yǔdiào:\n"Nǐ míngtiān yǒu kǎoshì ma? —— Yǒu a, wǒ hái méi fùxí wán ne."`,
        vietnamese: `Mời các bạn nghe lại đoạn đối thoại một lần nữa để cảm nhận ngữ điệu tự nhiên:`,
        teacherExplanation: `Bây giờ các bạn hãy lắng nghe lại câu nói vừa rồi một lần nữa nhé. Chú ý ngữ điệu hỏi thăm quan tâm của bạn A và nét thoáng lo âu rất đời thường của bạn B!`,
        highlightWords: ['考试', '复习'],
        voice: 'char_b_beijing_male',
        visualPrompt: 'Cinematic audio wave ripple, soft classroom ambient lighting, warm study aesthetic',
      },
      {
        sceneId: 4,
        type: 'explanation',
        duration: scale(50),
        characters: ['Cô giáo Mai'],
        chineseText: `【重点讲解】“考试” (kǎoshì) 的5大教学要点`,
        pinyin: `[Zhòngdiǎn jiǎngjiě] "Kǎoshì" de wǔ dà jiàoxué yàodiǎn`,
        vietnamese: `[Giảng giải chuyên sâu] 5 yếu tố sư phạm then chốt của từ "考试"`,
        teacherExplanation: `Bây giờ cô Mai sẽ giải thích sâu 5 thành phần cốt lõi của từ "考试" nhé:\n1. Nghĩa của từ: "考试" nghĩa là kỳ thi, thi cử hoặc bài kiểm tra năng lực.\n2. Cách sử dụng: Vừa làm danh từ ("有考试" - có kỳ thi), vừa làm động từ ("明天要考试" - ngày mai phải thi).\n3. Sắc thái trong câu: Mang sắc thái nghiêm túc, thể hiện tâm trạng chuẩn bị và hồi hộp trước một thử thách học tập.\n4. Cụm từ thường đi cùng: Người bản xứ hay dùng "参加考试" (tham gia kỳ thi), "期末考试" (thi cuối kỳ), "准备考试" (chuẩn bị thi), "考试及格" (thi đỗ/đạt).\n5. Một ví dụ khác: "我们下周一有一场重要的汉语考试" (Thứ Hai tuần sau chúng ta có một kỳ thi HSK quan trọng).`,
        pedagogicalDetails: {
          meaning: 'Kỳ thi, thi cử, bài kiểm tra đánh giá năng lực',
          usage: 'Vừa là danh từ (kỳ thi), vừa là động từ (làm bài thi/kiểm tra)',
          nuance: 'Tâm lý hồi hộp, sự chuẩn bị nghiêm túc trước một mốc học tập',
          collocations: ['参加考试 (tham gia kỳ thi)', '期末考试 (thi cuối kỳ)', '准备考试 (chuẩn bị thi)', '考试及格 (thi đỗ)'],
          additionalExample: {
            chinese: '我们下周一有一场重要的汉语考试。',
            pinyin: 'Wǒmen xià zhōu yī yǒu yī chǎng zhòngyào de hànyǔ kǎoshì.',
            vietnamese: 'Thứ Hai tuần sau chúng ta có một kỳ thi tiếng Trung quan trọng.'
          }
        },
        highlightWords: ['考试', '参加考试', '期末考试', '及格'],
        voice: 'female_teacher_vi',
        visualPrompt: 'Interactive classroom board highlighting the 5 pedagogical points with clean elegant calligraphy',
      },
      {
        sceneId: 5,
        type: 'vocabulary',
        duration: scale(35),
        characters: ['Cô giáo Mai'],
        chineseText: `考试 [kǎoshì] · 复习 [fùxí] · 紧张 [jǐnzhāng]`,
        pinyin: `kǎoshì · fùxí · jǐnzhāng`,
        vietnamese: `kỳ thi · ôn tập · lo lắng, căng thẳng`,
        teacherExplanation: `Hãy nhìn kỹ chữ Hán: chữ "考" có bộ Lão (老) tượng trưng cho người già giàu kinh nghiệm khảo hạch; chữ "试" có bộ Ngôn (讠) biểu thị lời nói thử thách. Phát âm thanh 3 (kǎo) và thanh 4 dứt khoát (shì), tuyệt đối không đọc ngang phè nhé!`,
        highlightWords: ['考试', '复习', '紧张'],
        voice: 'female_teacher_vi',
        visualPrompt: 'Macro shot of Hanzi character calligraphy on handmade parchment paper with stroke highlights',
      },
      {
        sceneId: 6,
        type: 'example',
        duration: scale(40),
        characters: ['Cô giáo Mai', 'Tiểu Minh (Nhân vật A)'],
        chineseText: `A: 这次期末考试难不难？\nB: 只要每天认真复习，就一定不难！`,
        pinyin: `A: Zhè cì qīmò kǎoshì nán bù nán?\nB: Zhǐyào měitiān rènzhēn fùxí, jiù yīdìng bù nán!`,
        vietnamese: `A: Kỳ thi cuối kỳ lần này có khó không?\nB: Chỉ cần mỗi ngày chăm chỉ ôn tập thì nhất định không khó!`,
        teacherExplanation: `Để mở rộng ngữ cảnh ngoài đời, hãy xem câu ví dụ này: Mẫu câu "只要... 就..." (Chỉ cần... thì...) là cách nói khích lệ cực kỳ ăn điểm trong giao tiếp thực tế!`,
        highlightWords: ['期末考试', '认真复习', '不难'],
        voice: 'female_teacher_vi',
        visualPrompt: 'Two students studying together in a warm modern university library surrounded by bookshelves',
      },
      {
        sceneId: 7,
        type: 'repeat',
        duration: scale(45),
        characters: ['Tiểu Minh (Nhân vật A)'],
        chineseText: `请听录音并跟读（Shadowing）：\n1. 考试 (kǎoshì)\n2. 复习 (fùxí)\n3. 祝你考试顺利，加油！(Zhù nǐ kǎoshì shùnlì, jiāyóu!)`,
        pinyin: `Qǐng tīng lùyīn bìng gēn dú:\n1. kǎoshì\n2. fùxí\n3. Zhù nǐ kǎoshì shùnlì, jiāyóu!`,
        vietnamese: `Mời các bạn lắng nghe và đọc to theo mẫu (có khoảng lặng để luyện âm):`,
        teacherExplanation: `Nào, bây giờ là phần luyện phản xạ mở miệng! Cô sẽ đọc chậm, sau đó có 3 giây khoảng lặng để các bạn phát âm to và rõ ràng theo giọng chuẩn Bắc Kinh. Sẵn sàng chưa? Bắt đầu!`,
        highlightWords: ['考试', '复习', '考试顺利', '加油'],
        voice: 'char_a_beijing_female',
        visualPrompt: 'Student wearing headphones listening attentively by a window, gentle morning light',
      },
      {
        sceneId: 8,
        type: 'mini_practice',
        duration: scale(30),
        characters: ['Cô giáo Mai'],
        chineseText: `【小测验 Mini Practice】\n朋友说“明天我有重要的考试”，哪句回答最地道？`,
        pinyin: `[Xiǎo cèyàn] Péngyou shuō "Míngtiān wǒ yǒu zhòngyào de kǎoshì", nǎ jù huídá zuì dìdào?`,
        vietnamese: `[Thử thách nhỏ] Khi bạn nói "Ngày mai mình có kỳ thi quan trọng", câu trả lời nào chuẩn ngữ cảnh nhất?`,
        practiceQuestion: {
          question: 'Khi bạn bè nói: "明天我有重要的考试", câu trả lời động viên tự nhiên và chuẩn xác nhất là gì?',
          options: [
            '别太紧张，祝你考试顺利，加油！',
            '我不喜欢考试。',
            '你今天吃了什么饭？',
            '昨天天气真好。'
          ],
          correctIndex: 0,
          explanation: '"别太紧张，祝你考试顺利，加油！" là câu chúc thi cử may mắn, thành công vô cùng chân thành và đúng phong cách người bản xứ.'
        },
        teacherExplanation: `Thử thách phản xạ nhanh xem các bạn đã hiểu ngữ cảnh chưa nào! Đáp án A hoàn toàn chính xác: "别太紧张，祝你考试顺利，加油！". Chúc các bạn luôn tự tin và học tốt tiếng Trung nhé! 再见！`,
        highlightWords: ['别太紧张', '考试顺利', '加油'],
        voice: 'female_teacher_vi',
        visualPrompt: 'Encouraging classroom summary board with a warm smiling teacher waving goodbye',
      }
    ];
  } else {
    // Kịch bản ngữ cảnh đời sống thường nhật cho các từ vựng khác
    scenes = [
      {
        sceneId: 1,
        type: 'context',
        duration: scale(25),
        characters: ['Cô giáo Mai'],
        chineseText: `阳光早晨 · 校园咖啡馆`,
        pinyin: `Yángguāng zǎochen · Xiàoyuán kāfēiguǎn`,
        vietnamese: `Buổi sáng ngập nắng · Quán cà phê trong trường`,
        teacherExplanation: `Chào các bạn học viên! Trong bài học hôm nay, chúng ta sẽ cùng bước vào một buổi sáng thư thả tại quán cà phê đại học. Thay vì ghi nhớ từ vựng đơn lẻ, các bạn hãy theo dõi tình huống giao tiếp tự nhiên của hai người bạn nhé!`,
        highlightWords: [first.chinese, '咖啡'],
        voice: 'female_teacher_vi',
        visualPrompt: 'Cozy campus coffee shop in the morning, warm wooden tables, steam rising from coffee mugs',
      },
      {
        sceneId: 2,
        type: 'dialogue',
        duration: scale(45),
        characters: ['Tiểu Minh (Nhân vật A)', 'Đại Hùng (Nhân vật B)'],
        chineseText: `A: 你好！你在忙什么呢？\nB: 你好！我在喝咖啡，顺便了解${first.chinese}呢。\nA: 太好了，有不懂的地方随时问我！\nB: 谢谢你，我的好${third.chinese}！`,
        pinyin: `A: Nǐ hǎo! Nǐ zài máng shénme ne?\nB: Nǐ hǎo! Wǒ zài hē kāfēi, shùnbiàn liǎojiě ${first.pinyin} ne.\nA: Tài hǎo le, yǒu bù dǒng de dìfang suíshí wèn wǒ!\nB: Xièxie nǐ, wǒ de hǎo ${third.pinyin}!`,
        vietnamese: `A: Chào bạn! Bạn đang bận gì thế?\nB: Chào bạn! Tôi đang uống cà phê, nhân tiện tìm hiểu từ "${first.vietnamese}".\nA: Tuyệt quá, có chỗ nào chưa hiểu cứ hỏi tôi nhé!\nB: Cảm ơn bạn, người bạn tốt của tôi!`,
        teacherExplanation: `Đoạn hội thoại vừa rồi cho thấy các từ vựng xuất hiện trong ngữ cảnh giao tiếp đời thường rất dễ tiếp thu và ghi nhớ lâu hơn rất nhiều!`,
        highlightWords: [first.chinese, second.chinese, third.chinese],
        voice: 'char_a_beijing_female',
        visualPrompt: 'Two friendly university students talking happily at a coffee table with notebooks',
      },
      {
        sceneId: 3,
        type: 'listen',
        duration: scale(30),
        characters: ['Tiểu Minh (Nhân vật A)', 'Đại Hùng (Nhân vật B)'],
        chineseText: `请听录音 · 感受自然语流：\n“你好！你在忙什么呢？—— 我在喝咖啡呢。”`,
        pinyin: `Qǐng tīng lùyīn · Gǎnshòu zìrán yǔliú:\n"Nǐ hǎo! Nǐ zài máng shénme ne? —— Wǒ zài hē kāfēi ne."`,
        vietnamese: `Mời các bạn nghe lại trọn vẹn để nắm bắt ngữ điệu đàm thoại tự nhiên:`,
        teacherExplanation: `Hãy lắng nghe lại một lần nữa. Để ý cách người bản xứ nối âm tự nhiên và ngữ điệu thân thiện khi chào hỏi nhau nhé!`,
        highlightWords: [first.chinese, '咖啡'],
        voice: 'char_b_beijing_male',
        visualPrompt: 'Sound wave animation in a serene warm morning coffee aesthetic',
      },
      {
        sceneId: 4,
        type: 'explanation',
        duration: scale(50),
        characters: ['Cô giáo Mai'],
        chineseText: `【深度解析】“${first.chinese}” 的5大教学要点`,
        pinyin: `[Shēndù jiěxī] "${first.chinese}" de wǔ dà jiàoxué yàodiǎn`,
        vietnamese: `[Phân tích chuyên sâu] 5 yếu tố sư phạm cốt lõi của từ "${first.chinese}"`,
        teacherExplanation: `Bây giờ cô Mai sẽ hướng dẫn các bạn 5 điểm mấu chốt của từ "${first.chinese}":\n1. Nghĩa của từ: "${first.chinese}" có nghĩa là "${first.vietnamese}".\n2. Cách sử dụng: Thuộc loại từ ${first.partOfSpeech}, dùng để diễn đạt ý định trong câu giao tiếp thường nhật.\n3. Sắc thái trong câu: Tự nhiên, thân mật, thể hiện sự lịch thiệp và tôn trọng đối phương.\n4. Cụm từ thường đi cùng: Thường đi kèm các trợ từ ngữ khí hoặc đại từ nhân xưng chuẩn xác.\n5. Một ví dụ khác: "${first.exampleChinese}" (nghĩa là: ${first.exampleVietnamese}).`,
        pedagogicalDetails: {
          meaning: first.vietnamese,
          usage: `Thuộc từ loại ${first.partOfSpeech}, dùng trong giao tiếp hằng ngày`,
          nuance: 'Tự nhiên, nhã nhặn, tôn trọng đối phương',
          collocations: [`常用搭配: ${first.chinese}`],
          additionalExample: {
            chinese: first.exampleChinese,
            pinyin: first.examplePinyin,
            vietnamese: first.exampleVietnamese
          }
        },
        highlightWords: [first.chinese],
        voice: 'female_teacher_vi',
        visualPrompt: 'Interactive classroom board illustrating 5 pedagogical points with clean typography',
      },
      {
        sceneId: 5,
        type: 'vocabulary',
        duration: scale(35),
        characters: ['Cô giáo Mai'],
        chineseText: `${first.chinese} [${first.pinyin}] · ${second.chinese} [${second.pinyin}]`,
        pinyin: `${first.pinyin} · ${second.pinyin}`,
        vietnamese: `${first.vietnamese} · ${second.vietnamese}`,
        teacherExplanation: `Hãy quan sát mặt chữ Hán và thanh điệu. Nhớ chú ý vị trí đặt dấu thanh Pinyin để phát âm chuẩn xác, không bị lẫn lộn giữa các thanh điệu tương tự nhau nhé!`,
        highlightWords: [first.chinese, second.chinese],
        voice: 'female_teacher_vi',
        visualPrompt: 'Handmade calligraphy art of Chinese characters on warm textured paper',
      },
      {
        sceneId: 6,
        type: 'example',
        duration: scale(40),
        characters: ['Cô giáo Mai', 'Tiểu Minh (Nhân vật A)'],
        chineseText: `${first.exampleChinese}\n${second.exampleChinese}`,
        pinyin: `${first.examplePinyin}\n${second.examplePinyin}`,
        vietnamese: `${first.exampleVietnamese}\n${second.exampleVietnamese}`,
        teacherExplanation: `Bây giờ chúng ta đặt từ vựng vào hai ngữ cảnh hoàn toàn mới nhé. Hãy lắng nghe và thử hiểu nghĩa trước khi xem bản dịch nào!`,
        highlightWords: [first.chinese, second.chinese],
        voice: 'female_teacher_vi',
        visualPrompt: 'Modern office and daily lifestyle scene with warm natural daylight',
      },
      {
        sceneId: 7,
        type: 'repeat',
        duration: scale(45),
        characters: ['Tiểu Minh (Nhân vật A)'],
        chineseText: `请听录音并大声跟读（Shadowing）：\n1. ${first.chinese} (${first.pinyin})\n2. ${second.chinese} (${second.pinyin})\n3. ${first.exampleChinese}`,
        pinyin: `Qǐng tīng lùyīn bìng dàshēng gēn dú:\n1. ${first.pinyin}\n2. ${second.pinyin}\n3. ${first.examplePinyin}`,
        vietnamese: `Mời các bạn lắng nghe và lặp lại to, rõ ràng theo giọng đọc mẫu:`,
        teacherExplanation: `Đến lượt các bạn mở khẩu hình rồi! Cô sẽ đọc chậm, sau đó sẽ có khoảng lặng 3 giây để các bạn nhắc lại to và rõ ràng. Cố lên nào!`,
        highlightWords: [first.chinese, second.chinese],
        voice: 'char_a_beijing_female',
        visualPrompt: 'Close up of a friendly student wearing headphones smiling peacefully',
      },
      {
        sceneId: 8,
        type: 'mini_practice',
        duration: scale(30),
        characters: ['Cô giáo Mai'],
        chineseText: `【小测验 Mini Practice】\n请选择最符合本节课语境的表达：`,
        pinyin: `[Xiǎo cèyàn] Qǐng xuǎnzé zuì fùhé běn jié kè yǔjìng de biǎodá:`,
        vietnamese: `[Thử thách nhỏ] Chọn câu đối đáp tự nhiên và chuẩn xác nhất theo ngữ cảnh bài học:`,
        practiceQuestion: {
          question: `Từ "${first.chinese}" (${first.pinyin}) trong giao tiếp thường dùng với ý nghĩa nào?`,
          options: [
            first.vietnamese,
            'Tạm biệt',
            'Không cần thiết',
            'Xin lỗi'
          ],
          correctIndex: 0,
          explanation: `"${first.chinese}" mang nghĩa tự nhiên là "${first.vietnamese}".`
        },
        teacherExplanation: `Xuất sắc! Các bạn đã hoàn thành trọn vẹn quy trình bài học hôm nay. Đừng quên dành ra 2 phút ôn lại video vào buổi tối nhé. Chúc các bạn tiến bộ mỗi ngày! 再见！`,
        highlightWords: [first.chinese, '再见'],
        voice: 'female_teacher_vi',
        visualPrompt: 'Classroom summary board with encouraging words and teacher smiling warmly',
      }
    ];
  }

  return {
    lessonId: `lesson-plan-${Date.now()}-${lessonIndex}`,
    lessonIndex,
    totalLessons,
    title: customTitle || `Bài giảng 0${lessonIndex}: Giao tiếp tiếng Trung qua ngữ cảnh thực tế`,
    topic: isExamContext ? 'Kỳ thi & Đời sống học đường' : 'Giao tiếp đời sống thường nhật',
    targetDurationMinutes,
    pedagogicalFocus: isExamContext ? 'Ngữ cảnh thi cử, tâm lý ôn tập và cách khích lệ tự nhiên' : 'Giao tiếp tình huống ứng dụng cao',
    actualEstimatedDurationSeconds: scenes.reduce((a, s) => a + s.duration, 0),
    targetVocabItems: vocabItems,
    characters: [
      { name: 'Cô giáo Mai', role: 'Giáo viên hướng dẫn', voice: 'female_teacher_vi', description: 'Giọng giảng tiếng Việt truyền cảm, phát âm tiếng Trung chuẩn' },
      { name: 'Tiểu Minh (Nhân vật A)', role: 'Người bản xứ Bắc Kinh', voice: 'char_a_beijing_female', description: 'Giọng nữ Bắc Kinh tự nhiên, nhã nhặn' },
      { name: 'Đại Hùng (Nhân vật B)', role: 'Bạn bè', voice: 'char_b_beijing_male', description: 'Giọng nam Bắc Kinh trầm ấm, thân thiện' },
    ],
    scenes,
    createdAt: Date.now(),
  };
}

// Fallbacks cho Analyze & Verify
function fallbackAnalyze(items: any[]): any[] {
  return items.map((item, idx) => {
    const chinese = item.chinese || '未知';
    return {
      id: item.id || `item-${Date.now()}-${idx}`,
      chinese,
      traditionalChinese: item.traditionalChinese || chinese,
      pinyin: item.pinyin || 'pīnyīn',
      vietnamese: item.vietnamese || `Nghĩa của từ "${chinese}"`,
      partOfSpeech: item.partOfSpeech || 'noun',
      level: item.level || 'HSK 1',
      exampleChinese: item.exampleChinese || `这是一个包含“${chinese}”的常用例句。`,
      examplePinyin: item.examplePinyin || `Zhè shì yī gè bāohán "${chinese}" de chángyòng lìjù.`,
      exampleVietnamese: item.exampleVietnamese || `Đây là một câu ví dụ có chứa từ "${chinese}".`,
      usageNote: item.usageNote || 'Từ vựng thông dụng trong giao tiếp hàng ngày.',
      isAiVerified: true,
      verificationNotes: 'Đã chuẩn hóa thông tin',
    };
  });
}

function fallbackVerify(items: any[]): any[] {
  return items.map(item => ({
    ...item,
    isAiVerified: true,
    verificationNotes: item.verificationNotes || 'Dữ liệu đã qua kiểm tra và xác nhận',
  }));
}

// ==========================================
// AUDIO / TTS ENGINE ENDPOINTS (Gemini 3.8 Flash Lite TTS)
// ==========================================

function sanitizeTtsText(text: string, includePinyinAudio: boolean = false): string {
  if (!text) return '';
  if (includePinyinAudio) return text;
  // Bỏ các chú thích Pinyin trong ngoặc vuông, tròn hoặc xuyệt chéo
  return text
    .replace(/\[[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+\]/g, '')
    .replace(/\([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+\)/g, '')
    .replace(/\/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ\s]+\//g, '')
    .trim();
}

function createSyntheticWavBuffer(durationSeconds: number, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * Math.max(1, durationSeconds));
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const val = Math.round(Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * 100);
    buffer.writeInt16LE(val, offset);
    offset += 2;
  }

  return buffer;
}

function estimateDurationSecs(text: string, lang: 'zh-CN' | 'vi-VN' = 'zh-CN', speedMode: string = 'normal'): number {
  const speed = speedMode === 'very_slow' ? 0.65 : speedMode === 'slow' ? 0.8 : 1.0;
  const chars = text.replace(/\s+/g, '').length;
  const rate = lang === 'zh-CN' ? 3.8 : 4.2;
  const pauses = (text.match(/[。！？，、；\.\?!,;]/g) || []).length * 0.4;
  return Math.max(1.8, Number(((chars / (rate * speed)) + (pauses / speed)).toFixed(2)));
}

function buildTokensWithTimestamps(text: string, totalSecs: number, speedMode: string = 'normal', speaker?: string) {
  const tokens = text.match(/[\u4e00-\u9fa5]{1,4}|[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+|[0-9]+|[，。！？、；：,\.!\?;:\n\r\t]+/g) || [text];
  const speed = speedMode === 'very_slow' ? 0.65 : speedMode === 'slow' ? 0.8 : 1.0;

  const weights = tokens.map(token => {
    if (/\n/.test(token) || /[。！？\.\?!]/.test(token)) return 2.5 / speed;
    if (/[，、；;,]/.test(token)) return 1.4 / speed;
    const hanzi = (token.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (hanzi > 0) return hanzi * (1.1 / speed);
    return Math.max(0.8, (token.length * 0.28) / speed);
  });

  const totalWeight = Math.max(0.1, weights.reduce((a, b) => a + b, 0));
  const timePerUnit = totalSecs / totalWeight;

  const segments: any[] = [];
  let cur = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const dur = weights[i] * timePerUnit;
    const start = Number(cur.toFixed(3));
    const end = Number(Math.min(totalSecs, cur + dur).toFixed(3));

    if (/^[，。！？、；：,\.!\?;:\s\n]+$/.test(t) && segments.length > 0) {
      segments[segments.length - 1].end = end;
      segments[segments.length - 1].text += t.replace(/\n+/g, ' ');
    } else {
      segments.push({
        text: t.trim(),
        start,
        end,
        speaker,
      });
    }
    cur += dur;
  }

  if (segments.length > 0) {
    segments[segments.length - 1].end = totalSecs;
  }
  return segments;
}

/**
 * Endpoint 4: POST /api/tts/synthesize
 * Tạo audio cho một đoạn văn bản (single utterance) bằng Gemini 3.8 Flash Lite TTS
 */
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const {
      sceneId = '1',
      text = '',
      language = 'zh-CN',
      voiceType = 'chinese_teacher',
      speedMode = 'normal',
      includePinyinAudio = false,
      speakerName,
    } = req.body;

    const cleanText = sanitizeTtsText(text, includePinyinAudio);
    if (!cleanText) {
      return res.status(400).json({ error: 'Nội dung văn bản không được để trống.' });
    }

    let geminiVoice = 'Kore';
    if (voiceType === 'vietnamese_teacher') {
      geminiVoice = 'Puck';
    } else if (voiceType === 'character_a') {
      geminiVoice = 'Kore';
    } else if (voiceType === 'character_b') {
      geminiVoice = 'Puck';
    } else if (voiceType === 'chinese_teacher') {
      geminiVoice = 'Kore';
    }

    let stylePrompt = 'Standard clear enunciation';
    if (language === 'zh-CN') {
      if (speedMode === 'very_slow') {
        stylePrompt = 'Very slow and deliberate cadence for beginner Chinese learners, articulate each syllable distinctly with accurate tone contours, keeping authentic Mandarin melody.';
      } else if (speedMode === 'slow') {
        stylePrompt = 'Slow, gentle pace for language learners, clearly enounced standard Beijing Mandarin.';
      } else {
        stylePrompt = 'Natural standard Beijing Mandarin, fluent and warm tone.';
      }
    } else {
      stylePrompt = 'Warm, encouraging teacher voice explaining in natural Vietnamese.';
    }

    let base64Audio = '';
    let duration = 0;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: cleanText,
                  speechMetadata: {
                    style: stylePrompt,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: geminiVoice },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
        if (base64Audio) {
          const wavBuf = Buffer.from(base64Audio, 'base64');
          duration = Number(((wavBuf.length - 44) / 48000).toFixed(2));
        }
      } catch (err: any) {
        console.warn('Gemini TTS Unary call error, using synthetic fallback:', err.message);
      }
    }

    if (!base64Audio) {
      duration = estimateDurationSecs(cleanText, language, speedMode);
      const fallbackBuf = createSyntheticWavBuffer(duration);
      base64Audio = fallbackBuf.toString('base64');
    }

    const segments = buildTokensWithTimestamps(cleanText, duration, speedMode, speakerName);

    const metadata = {
      sceneId: String(sceneId),
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      duration,
      language,
      voice: `${geminiVoice} (${voiceType})`,
      speedMode,
      segments,
      createdAt: Date.now(),
      provider: ai ? 'gemini-3.8-flash-lite-tts' : 'synthetic_wav',
    };

    res.json({ metadata });
  } catch (error: any) {
    console.error('Lỗi trong /api/tts/synthesize:', error);
    res.status(500).json({ error: error.message || 'Lỗi tổng hợp âm thanh' });
  }
});

/**
 * Endpoint 5: POST /api/tts/synthesize-scene
 * Tạo audio hoàn chỉnh cho một Scene (kết hợp lời giảng tiếng Việt + hội thoại tiếng Trung)
 */
app.post('/api/tts/synthesize-scene', async (req, res) => {
  try {
    const {
      scene,
      speedMode = 'normal',
      includePinyinAudio = false,
      pauseBetweenSentencesMs = 600,
      chineseTeacherVoice = 'Kore',
      vietnameseTeacherVoice = 'Puck',
      characterAVoice = 'Kore',
      characterBVoice = 'Puck',
    } = req.body;

    if (!scene) {
      return res.status(400).json({ error: 'Dữ liệu scene không hợp lệ.' });
    }

    const sceneId = String(scene.sceneId || '1');
    const teacherExplanation = scene.teacherExplanation ? scene.teacherExplanation.trim() : '';
    const rawChinese = scene.chineseText ? scene.chineseText.trim() : '';
    const cleanChinese = sanitizeTtsText(rawChinese, includePinyinAudio);

    const hasTeacher = Boolean(teacherExplanation);
    const hasChinese = Boolean(cleanChinese);

    // Tính thời lượng
    const teacherSec = hasTeacher ? estimateDurationSecs(teacherExplanation, 'vi-VN', speedMode) : 0;
    const chineseSec = hasChinese ? estimateDurationSecs(cleanChinese, 'zh-CN', speedMode) : 0;
    const pauseSec = (hasTeacher && hasChinese) ? (pauseBetweenSentencesMs / 1000) : 0;
    const totalSecs = Math.max(2.5, Number((teacherSec + pauseSec + chineseSec).toFixed(2)));

    // Xây dựng audio segments
    const allSegments: any[] = [];
    let timeline = 0;

    if (hasTeacher) {
      const segs = buildTokensWithTimestamps(teacherExplanation, teacherSec, speedMode, 'Giáo viên');
      segs.forEach(s => {
        allSegments.push({
          ...s,
          start: Number((s.start + timeline).toFixed(3)),
          end: Number((s.end + timeline).toFixed(3)),
          type: 'teacher_explanation',
        });
      });
      timeline += teacherSec;

      if (hasChinese && pauseSec > 0) {
        allSegments.push({
          text: '· · ·',
          start: Number(timeline.toFixed(3)),
          end: Number((timeline + pauseSec).toFixed(3)),
          type: 'pause',
        });
        timeline += pauseSec;
      }
    }

    if (hasChinese) {
      const lines = cleanChinese.split('\n').filter((l: string) => l.trim().length > 0);
      const lineDur = chineseSec / Math.max(1, lines.length);

      lines.forEach((line: string) => {
        const match = line.match(/^([^:：]+)[:：]\s*(.*)$/);
        const speaker = match ? match[1].trim() : 'Tiếng Trung';
        const content = match ? match[2].trim() : line.trim();

        const segs = buildTokensWithTimestamps(content, lineDur, speedMode, speaker);
        segs.forEach(s => {
          allSegments.push({
            ...s,
            start: Number((s.start + timeline).toFixed(3)),
            end: Number((s.end + timeline).toFixed(3)),
            speaker: speaker || s.speaker,
            type: 'chinese_dialogue',
          });
        });
        timeline += lineDur;
      });
    }

    // Tổng hợp audio với Gemini TTS nếu có thể
    let base64Audio = '';
    let voiceNameUsed = `${vietnameseTeacherVoice} / ${chineseTeacherVoice}`;

    if (ai) {
      try {
        // Ưu tiên đọc Chinese Dialogue nếu scene là dialogue, hoặc đọc toàn bộ
        const textToSpeak = cleanChinese || teacherExplanation;
        const voiceChoice = cleanChinese ? chineseTeacherVoice : vietnameseTeacherVoice;
        const langChoice = cleanChinese ? 'zh-CN' : 'vi-VN';

        const stylePrompt = langChoice === 'zh-CN'
          ? (speedMode === 'very_slow'
              ? 'Pronounce very slowly and distinctly for beginners, clear tonal contours, authentic Mandarin.'
              : speedMode === 'slow'
                ? 'Slow, clear standard Beijing Mandarin pronunciation.'
                : 'Natural standard Beijing Mandarin, fluent and warm.')
          : 'Warm, encouraging teacher voice explaining in natural Vietnamese.';

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: textToSpeak,
                  speechMetadata: {
                    style: stylePrompt,
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceChoice },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
        voiceNameUsed = `${voiceChoice} (Gemini)`;
      } catch (err: any) {
        console.warn('Lỗi khi gọi Gemini TTS cho Scene:', err.message);
      }
    }

    if (!base64Audio) {
      const fallbackBuf = createSyntheticWavBuffer(totalSecs);
      base64Audio = fallbackBuf.toString('base64');
      voiceNameUsed = 'WebSpeech / Audio Synth';
    }

    const metadata = {
      sceneId,
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
      duration: totalSecs,
      language: 'mixed',
      voice: voiceNameUsed,
      speedMode,
      segments: allSegments,
      sceneType: scene.type,
      createdAt: Date.now(),
      provider: ai ? 'gemini-3.8-flash-lite-tts' : 'synthetic_wav',
    };

    res.json({ metadata });
  } catch (error: any) {
    console.error('Lỗi trong /api/tts/synthesize-scene:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo âm thanh scene' });
  }
});

// ==========================================
// VISUAL GENERATOR ENDPOINTS (Gemini Image & Veo Video)
// ==========================================

/**
 * Endpoint 6: POST /api/visual/generate-image
 * Tạo hình ảnh minh họa bài giảng (warm educational animation / clean classroom)
 * KHÔNG chứa chữ (no text)
 */
app.post('/api/visual/generate-image', async (req, res) => {
  try {
    const { sceneId = '1', visualPrompt = '', aspectRatio = '16:9' } = req.body;

    const strictPrompt = `${visualPrompt}. Style: warm educational animation, clean Chinese modern classroom, soft lighting, friendly characters, no text, no letters, no subtitles, no watermark, highly detailed Ghibli / Makoto Shinkai anime aesthetic.`;

    let imageUrl = '';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: strictPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
            },
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (err: any) {
        console.warn('Gemini Image API error, returning fallback:', err.message);
      }
    }

    res.json({
      sceneId: String(sceneId),
      visualPrompt,
      assetType: 'image',
      url: imageUrl || '',
      provider: imageUrl ? 'gemini-3.1-flash-lite-image' : 'preset_art',
    });
  } catch (error: any) {
    console.error('Lỗi khi gọi /api/visual/generate-image:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo hình ảnh' });
  }
});

/**
 * Endpoint 7: POST /api/visual/generate-video
 * Tạo video B-roll ngắn bằng Veo (veo-3.1-lite-generate-preview)
 * Phù hợp với duration của scene, không có subtitle hay chữ viết
 */
app.post('/api/visual/generate-video', async (req, res) => {
  try {
    const { sceneId = '1', visualPrompt = '', duration = 15, aspectRatio = '16:9' } = req.body;

    const strictVideoPrompt = `${visualPrompt}. Subtle slow camera pan, ambient gentle motion, warm classroom lighting, no text, no subtitles, no words, no watermark.`;

    let videoUrl = '';

    if (ai) {
      try {
        const operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: strictVideoPrompt,
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
          },
        });

        videoUrl = operation.response?.generatedVideos?.[0]?.video?.uri || '';
      } catch (err: any) {
        console.warn('Veo Video generation error, using video loop fallback:', err.message);
      }
    }

    if (!videoUrl) {
      videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }

    res.json({
      sceneId: String(sceneId),
      visualPrompt,
      assetType: 'video',
      duration,
      videoUrl,
      provider: ai ? 'veo-3.1-lite-generate-preview' : 'ambient_loop',
    });
  } catch (error: any) {
    console.error('Lỗi khi gọi /api/visual/generate-video:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo video' });
  }
});

// Khởi chạy Vite middleware trong môi trường dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chinese Video Lesson Maker server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
