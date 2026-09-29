import React, { useState } from 'react';
import { PlusCircle, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { VocabItem } from '../../types/lesson';
import { parseRawLine, containsChinese, extractChineseTokens } from '../../services/fileParser';

interface DirectTextInputProps {
  onAddDirectItems: (items: VocabItem[]) => void;
}

export const DirectTextInput: React.FC<DirectTextInputProps> = ({ onAddDirectItems }) => {
  const [rawText, setRawText] = useState<string>('');
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  // Thống kê nhanh
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  const detectedTokens = extractChineseTokens(rawText);

  const handleParseAndAdd = () => {
    if (!rawText.trim()) return;

    const parsedItems: VocabItem[] = [];
    const rawLines = rawText.split('\n');

    rawLines.forEach((line, idx) => {
      const item = parseRawLine(line, idx);
      if (item && item.chinese) {
        parsedItems.push(item);
      }
    });

    if (parsedItems.length > 0) {
      onAddDirectItems(parsedItems);
      setSuccessNotif(`Đã thêm thành công ${parsedItems.length} mục vào danh sách!`);
      setRawText('');
      setTimeout(() => setSuccessNotif(null), 3000);
    }
  };

  const handleInsertSample = (sampleType: 'basic' | 'shopping' | 'raw') => {
    if (sampleType === 'basic') {
      setRawText(
        `你好 - nǐ hǎo - Xin chào\n` +
        `谢谢 - xièxie - Cảm ơn\n` +
        `再见 - zàijiàn - Tạm biệt\n` +
        `朋友 - péngyou - Bạn bè\n` +
        `学习 - xuéxí - Học tập`
      );
    } else if (sampleType === 'shopping') {
      setRawText(
        `多少钱 - duōshao qián - Bao nhiêu tiền?\n` +
        `太贵了 - tài guì le - Đắt quá rồi\n` +
        `买东西 - mǎi dōngxi - Mua sắm đồ đạc`
      );
    } else {
      setRawText(
        `咖啡\n` +
        `饭馆\n` +
        `工作\n` +
        `天气\n` +
        `懂`
      );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Nhập trực tiếp từ / câu tiếng Trung</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gõ hoặc dán danh sách từ vựng. Bạn có thể chỉ nhập chữ Hán, hệ thống sẽ tự phân tích và bổ sung Pinyin, dịch nghĩa sau.
          </p>
        </div>

        <button
          onClick={() => setShowHelper(!showHelper)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHelper ? 'Ẩn hướng dẫn cú pháp' : 'Xem cú pháp hỗ trợ'}</span>
        </button>
      </div>

      {/* Syntax Guide Box */}
      {showHelper && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 text-slate-600">
          <p className="font-semibold text-slate-800">
            Các định dạng bạn có thể nhập (mỗi dòng một mục):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block mb-0.5 font-sans">1. Chỉ có chữ Hán thô:</span>
              <p className="text-slate-800 font-bold">你好</p>
              <p className="text-slate-800 font-bold">咖啡</p>
              <span className="text-[10px] text-amber-600 mt-1 block font-sans">→ AI sẽ tự bù Pinyin & nghĩa</span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block mb-0.5 font-sans">2. Hán tự + Nghĩa:</span>
              <p className="text-slate-800">学习 - Học tập</p>
              <p className="text-slate-800">朋友 - Bạn bè</p>
              <span className="text-[10px] text-blue-600 mt-1 block font-sans">→ AI sẽ bù Pinyin có thanh điệu</span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-400 block mb-0.5 font-sans">3. Đầy đủ các trường:</span>
              <p className="text-slate-800">谢谢, xièxie, Cảm ơn</p>
              <p className="text-slate-800">再见 - zàijiàn - Tạm biệt</p>
              <span className="text-[10px] text-emerald-600 mt-1 block font-sans">→ Nhận dạng hoàn chỉnh ngay</span>
            </div>
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Dán danh sách từ hoặc câu vào đây (mỗi dòng một mục)...\nVí dụ:\n你好 - nǐ hǎo - Xin chào\n谢谢 - xièxie - Cảm ơn\n咖啡`}
          rows={5}
          className="w-full p-3.5 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono transition-colors outline-none resize-y"
        />

        {/* Live Counters */}
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
          <div className="flex items-center gap-3">
            <span>
              Số dòng: <strong className="font-mono tabular-nums text-slate-800">{lines.length}</strong>
            </span>
            <span>·</span>
            <span>
              Ký tự Hán phát hiện: <strong className="font-mono tabular-nums text-slate-800">{detectedTokens.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Chèn nhanh:</span>
            <button
              onClick={() => handleInsertSample('basic')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              Cơ bản
            </button>
            <button
              onClick={() => handleInsertSample('shopping')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              Mua sắm
            </button>
            <button
              onClick={() => handleInsertSample('raw')}
              className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded transition-colors"
            >
              Chữ thô
            </button>
          </div>
        </div>
      </div>

      {successNotif && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successNotif}</span>
        </div>
      )}

      {/* Action button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleParseAndAdd}
          disabled={!rawText.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Thêm vào danh sách nhận dạng</span>
        </button>
      </div>

    </div>
  );
};
