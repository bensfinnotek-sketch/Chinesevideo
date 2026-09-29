/**
 * Chinese-Vietnamese Vocabulary Database
 * Dữ liệu từ vựng HSK & Giao tiếp thường dùng phục vụ nhận dạng, tra cứu nhanh và làm dữ liệu mẫu
 * Chuẩn hóa 100% theo cấu trúc vocabulary item mới
 */

import { VocabItem, PartOfSpeech } from '../types/lesson';

export interface DictEntry {
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
}

export const COMMON_CHINESE_DICT: Record<string, DictEntry> = {
  '你好': {
    chinese: '你好',
    traditionalChinese: '你好',
    pinyin: 'nǐ hǎo',
    vietnamese: 'Xin chào, chào bạn',
    partOfSpeech: 'phrase',
    level: 'HSK 1',
    exampleChinese: '你好，很高兴认识你！',
    examplePinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!',
    exampleVietnamese: 'Xin chào, rất vui được làm quen với bạn!',
    usageNote: 'Lời chào phổ biến nhất trong tiếng Trung. Dùng trong mọi hoàn cảnh giao tiếp hàng ngày.'
  },
  '谢谢': {
    chinese: '谢谢',
    traditionalChinese: '謝謝',
    pinyin: 'xièxie',
    vietnamese: 'Cảm ơn, cảm tạ',
    partOfSpeech: 'verb',
    level: 'HSK 1',
    exampleChinese: '太谢谢你的热情帮助了。',
    examplePinyin: 'Tài xièxie nǐ de rèqíng bāngzhù le.',
    exampleVietnamese: 'Cảm ơn sự giúp đỡ nhiệt tình của bạn rất nhiều.',
    usageNote: 'Âm tiết thứ hai đọc thanh nhẹ. Có thể dùng đơn lẻ hoặc kết hợp: 谢谢你.'
  },
  '再见': {
    chinese: '再见',
    traditionalChinese: '再見',
    pinyin: 'zàijiàn',
    vietnamese: 'Tạm biệt, hẹn gặp lại',
    partOfSpeech: 'verb',
    level: 'HSK 1',
    exampleChinese: '明天学校见，再见！',
    examplePinyin: 'Míngtiān xuéxiào jiàn, zàijiàn!',
    exampleVietnamese: 'Ngày mai gặp ở trường nhé, tạm biệt!',
    usageNote: 'Nghĩa gốc là "hẹn gặp lại lần nữa" (tái kiến). Dùng khi chào tạm biệt lịch sự.'
  },
  '学习': {
    chinese: '学习',
    traditionalChinese: '學習',
    pinyin: 'xuéxí',
    vietnamese: 'Học tập, học hỏi, nghiên cứu',
    partOfSpeech: 'verb',
    level: 'HSK 1',
    exampleChinese: '我每天努力学习汉语。',
    examplePinyin: 'Wǒ měitiān nǔlì xuéxí hànyǔ.',
    exampleVietnamese: 'Tôi mỗi ngày đều chăm chỉ học tiếng Hán.',
    usageNote: 'Có thể làm động từ ("học tập") hoặc danh từ ("việc học").'
  },
  '汉语': {
    chinese: '汉语',
    traditionalChinese: '漢語',
    pinyin: 'hànyǔ',
    vietnamese: 'Tiếng Trung, tiếng Hán',
    partOfSpeech: 'noun',
    level: 'HSK 1',
    exampleChinese: '学会汉语可以去中国旅行。',
    examplePinyin: 'Xuéhuì hànyǔ kěyǐ qù zhōngguó lǚxíng.',
    exampleVietnamese: 'Học biết tiếng Hán có thể đi du lịch Trung Quốc.',
    usageNote: 'Chỉ ngôn ngữ của người Hán. Trong khẩu ngữ thường dùng kết hợp 中文 (Zhōngwén).'
  },
  '中国': {
    chinese: '中国',
    traditionalChinese: '中國',
    pinyin: 'zhōngguó',
    vietnamese: 'Trung Quốc',
    partOfSpeech: 'noun',
    level: 'HSK 1',
    exampleChinese: '我想去中国看万里长城。',
    examplePinyin: 'Wǒ xiǎng qù zhōngguó kàn wànlǐ chángchéng.',
    exampleVietnamese: 'Tôi muốn đến Trung Quốc ngắm Vạn Lý Trường Thành.',
    usageNote: 'Tên quốc gia. Khi đi kèm người: 中国人 (người Trung Quốc).'
  },
  '朋友': {
    chinese: '朋友',
    traditionalChinese: '朋友',
    pinyin: 'péngyou',
    vietnamese: 'Bạn bè, bạn thân',
    partOfSpeech: 'noun',
    level: 'HSK 1',
    exampleChinese: '他是我最好的中国朋友。',
    examplePinyin: 'Tā shì wǒ zuì hǎo de zhōngguó péngyou.',
    exampleVietnamese: 'Anh ấy là người bạn Trung Quốc tốt nhất của tôi.',
    usageNote: 'Từ "友" (you) thường đọc thanh nhẹ trong khẩu ngữ.'
  },
  '咖啡': {
    chinese: '咖啡',
    traditionalChinese: '咖啡',
    pinyin: 'kāfēi',
    vietnamese: 'Cà phê',
    partOfSpeech: 'noun',
    level: 'HSK 2',
    exampleChinese: '早上一杯热咖啡让人精神充沛。',
    examplePinyin: 'Zǎoshang yībēi rè kāfēi ràng rén jīngshén chōngpèi.',
    exampleVietnamese: 'Một tách cà phê nóng vào buổi sáng khiến con người tràn đầy năng lượng.',
    usageNote: 'Từ mượn phiên âm tiếng nước ngoài (coffee). Lượng từ thông dụng là 杯 (bēi - tách/ly).'
  },
  '工作': {
    chinese: '工作',
    traditionalChinese: '工作',
    pinyin: 'gōngzuò',
    vietnamese: 'Công việc, làm việc',
    partOfSpeech: 'verb',
    level: 'HSK 1',
    exampleChinese: '他在一家国际公司工作。',
    examplePinyin: 'Tā zài yījiā guójì gōngsī gōngzuò.',
    exampleVietnamese: 'Anh ấy làm việc tại một công ty quốc tế.',
    usageNote: 'Vừa là động từ ("làm việc"), vừa là danh từ ("công việc, nghề nghiệp").'
  },
  '喜欢': {
    chinese: '喜欢',
    traditionalChinese: '喜歡',
    pinyin: 'xǐhuan',
    vietnamese: 'Thích, yêu thích',
    partOfSpeech: 'verb',
    level: 'HSK 1',
    exampleChinese: '我很喜欢吃越南河粉。',
    examplePinyin: 'Wǒ hěn xǐhuan chī yuènán héfěn.',
    exampleVietnamese: 'Tôi rất thích ăn phở Việt Nam.',
    usageNote: 'Động từ chỉ cảm xúc tâm lý. Thường đi sau phó từ chỉ mức độ: 很喜欢, 非常喜欢.'
  },
  '饭馆': {
    chinese: '饭馆',
    traditionalChinese: '飯館',
    pinyin: 'fànguǎn',
    vietnamese: 'Nhà hàng, quán ăn',
    partOfSpeech: 'noun',
    level: 'HSK 2',
    exampleChinese: '这家饭馆的烤鸭非常好吃。',
    examplePinyin: 'Zhè jiā fànguǎn de kǎoyā fēicháng hǎochī.',
    exampleVietnamese: 'Vịt quay của quán ăn này rất ngon.',
    usageNote: 'Lượng từ thường dùng là 家 (jiā). Quán ăn nhỏ hoặc nhà hàng bình dân.'
  },
  '买东西': {
    chinese: '买东西',
    traditionalChinese: '買東西',
    pinyin: 'mǎi dōngxi',
    vietnamese: 'Mua sắm, mua đồ đạc',
    partOfSpeech: 'phrase',
    level: 'HSK 1',
    exampleChinese: '周末我们一起去超市买东西吧。',
    examplePinyin: 'Zhōumò wǒmen yīqǐ qù chāoshì mǎi dōngxi ba.',
    exampleVietnamese: 'Cuối tuần chúng mình cùng đi siêu thị mua sắm nhé.',
    usageNote: 'Cụm động tân: 买 (mua) + 东西 (đồ đạc). Khái niệm đồ đạc mượn từ 2 hướng Đông - Tây.'
  },
  '多少钱': {
    chinese: '多少钱',
    traditionalChinese: '多少錢',
    pinyin: 'duōshao qián',
    vietnamese: 'Bao nhiêu tiền?',
    partOfSpeech: 'phrase',
    level: 'HSK 1',
    exampleChinese: '老板，这件衣服多少钱？',
    examplePinyin: 'Lǎobǎn, zhè jiàn yīfu duōshao qián?',
    exampleVietnamese: 'Ông chủ, chiếc áo này bao nhiêu tiền?',
    usageNote: 'Mẫu câu hỏi giá kinh điển trong giao tiếp mua bán. 少 (shao) đọc thanh nhẹ.'
  },
  '太贵了': {
    chinese: '太贵了',
    traditionalChinese: '太貴了',
    pinyin: 'tài guì le',
    vietnamese: 'Đắt quá, đắt đỏ quá rồi',
    partOfSpeech: 'phrase',
    level: 'HSK 2',
    exampleChinese: '三十块太贵了，便宜点儿吧。',
    examplePinyin: 'Sānshí kuài tài guì le, piányi diǎnr ba.',
    exampleVietnamese: 'Ba mươi đồng đắt quá rồi, bớt một chút đi.',
    usageNote: 'Cấu trúc "太...了" biểu thị mức độ quá đáng hoặc thán từ mặc cả.'
  }
};

export const SAMPLE_PRESETS: { label: string; description: string; items: VocabItem[] }[] = [
  {
    label: 'Chào hỏi & Giao tiếp cơ bản (HSK 1)',
    description: 'Bộ từ vựng nền tảng khi mới bắt đầu tiếp xúc tiếng Trung',
    items: [
      {
        id: 'sample-1',
        chinese: '你好',
        traditionalChinese: '你好',
        pinyin: 'nǐ hǎo',
        vietnamese: 'Xin chào, chào bạn',
        partOfSpeech: 'phrase',
        level: 'HSK 1',
        exampleChinese: '你好，很高兴认识你！',
        examplePinyin: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!',
        exampleVietnamese: 'Xin chào, rất vui được làm quen với bạn!',
        usageNote: 'Lời chào phổ biến nhất trong tiếng Trung. Dùng trong mọi hoàn cảnh giao tiếp hàng ngày.',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      },
      {
        id: 'sample-2',
        chinese: '谢谢',
        traditionalChinese: '謝謝',
        pinyin: 'xièxie',
        vietnamese: 'Cảm ơn, cảm tạ',
        partOfSpeech: 'verb',
        level: 'HSK 1',
        exampleChinese: '太谢谢你的热情帮助了。',
        examplePinyin: 'Tài xièxie nǐ de rèqíng bāngzhù le.',
        exampleVietnamese: 'Cảm ơn sự giúp đỡ nhiệt tình của bạn rất nhiều.',
        usageNote: 'Âm tiết thứ hai đọc thanh nhẹ. Có thể dùng đơn lẻ hoặc kết hợp: 谢谢你.',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      },
      {
        id: 'sample-3',
        chinese: '再见',
        traditionalChinese: '再見',
        pinyin: 'zàijiàn',
        vietnamese: 'Tạm biệt, hẹn gặp lại',
        partOfSpeech: 'verb',
        level: 'HSK 1',
        exampleChinese: '明天学校见，再见！',
        examplePinyin: 'Míngtiān xuéxiào jiàn, zàijiàn!',
        exampleVietnamese: 'Ngày mai gặp ở trường nhé, tạm biệt!',
        usageNote: 'Nghĩa gốc là "hẹn gặp lại lần nữa". Dùng khi chào tạm biệt lịch sự.',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      },
      {
        id: 'sample-4',
        chinese: '学习',
        traditionalChinese: '學習',
        pinyin: 'xuéxí',
        vietnamese: 'Học tập, học hỏi',
        partOfSpeech: 'verb',
        level: 'HSK 1',
        exampleChinese: '我每天努力学习汉语。',
        examplePinyin: 'Wǒ měitiān nǔlì xuéxí hànyǔ.',
        exampleVietnamese: 'Tôi mỗi ngày đều chăm chỉ học tiếng Hán.',
        usageNote: 'Có thể làm động từ ("học tập") hoặc danh từ ("việc học").',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      },
      {
        id: 'sample-5',
        chinese: '朋友',
        traditionalChinese: '朋友',
        pinyin: 'péngyou',
        vietnamese: 'Bạn bè, bạn hữu',
        partOfSpeech: 'noun',
        level: 'HSK 1',
        exampleChinese: '他是我最好的中国朋友。',
        examplePinyin: 'Tā shì wǒ zuì hǎo de zhōngguó péngyou.',
        exampleVietnamese: 'Anh ấy là người bạn Trung Quốc tốt nhất của tôi.',
        usageNote: 'Từ "友" (you) thường đọc thanh nhẹ trong khẩu ngữ.',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      }
    ]
  },
  {
    label: 'Mua sắm & Trả giá (Thực chiến)',
    description: 'Mẫu câu và từ vựng thông dụng khi đi chợ hoặc siêu thị',
    items: [
      {
        id: 'sample-shop-1',
        chinese: '多少钱',
        traditionalChinese: '多少錢',
        pinyin: 'duōshao qián',
        vietnamese: 'Bao nhiêu tiền?',
        partOfSpeech: 'phrase',
        level: 'HSK 1',
        exampleChinese: '老板，这件衣服多少钱？',
        examplePinyin: 'Lǎobǎn, zhè jiàn yīfu duōshao qián?',
        exampleVietnamese: 'Ông chủ, chiếc áo này bao nhiêu tiền?',
        usageNote: 'Mẫu câu hỏi giá kinh điển trong giao tiếp mua bán.',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      },
      {
        id: 'sample-shop-2',
        chinese: '太贵了',
        traditionalChinese: '太貴了',
        pinyin: 'tài guì le',
        vietnamese: 'Đắt quá rồi, mắc quá',
        partOfSpeech: 'phrase',
        level: 'HSK 2',
        exampleChinese: '三十块太贵了，便宜点儿吧。',
        examplePinyin: 'Sānshí kuài tài guì le, piányi diǎnr ba.',
        exampleVietnamese: 'Ba mươi đồng đắt quá rồi, rẻ hơn chút đi.',
        usageNote: 'Cấu trúc thán từ cảm thán biểu thị mức độ quá đáng để mặc cả giá.',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      },
      {
        id: 'sample-shop-3',
        chinese: '买东西',
        traditionalChinese: '買東西',
        pinyin: 'mǎi dōngxi',
        vietnamese: 'Mua sắm, mua đồ đạc',
        partOfSpeech: 'phrase',
        level: 'HSK 1',
        exampleChinese: '周末我们一起去超市买东西吧。',
        examplePinyin: 'Zhōumò wǒmen yīqǐ qù chāoshì mǎi dōngxi ba.',
        exampleVietnamese: 'Cuối tuần chúng mình cùng đi siêu thị mua sắm nhé.',
        usageNote: 'Cụm động tân: 买 (mua) + 东西 (đồ đạc).',
        isAiVerified: true,
        verificationNotes: 'Dữ liệu chuẩn xác 100%'
      }
    ]
  },
  {
    label: 'Danh sách thô cần AI xử lý (Chưa có Pinyin & Nghĩa)',
    description: 'Chỉ có chữ Hán thô, sẵn sàng để Gemini AI tự động phân tích và chuẩn hóa',
    items: [
      {
        id: 'raw-1',
        chinese: '咖啡',
        traditionalChinese: '',
        pinyin: '',
        vietnamese: '',
        partOfSpeech: 'noun',
        level: 'Chờ AI phân tích',
        exampleChinese: '',
        examplePinyin: '',
        exampleVietnamese: '',
        usageNote: '',
        isAiVerified: false
      },
      {
        id: 'raw-2',
        chinese: '饭馆',
        traditionalChinese: '',
        pinyin: '',
        vietnamese: '',
        partOfSpeech: 'noun',
        level: 'Chờ AI phân tích',
        exampleChinese: '',
        examplePinyin: '',
        exampleVietnamese: '',
        usageNote: '',
        isAiVerified: false
      },
      {
        id: 'raw-3',
        chinese: '工作',
        traditionalChinese: '',
        pinyin: '',
        vietnamese: '',
        partOfSpeech: 'verb',
        level: 'Chờ AI phân tích',
        exampleChinese: '',
        examplePinyin: '',
        exampleVietnamese: '',
        usageNote: '',
        isAiVerified: false
      }
    ]
  }
];
