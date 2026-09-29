import React, { useState } from 'react';
import { 
  X, 
  Download, 
  CheckCircle2, 
  FileText, 
  Film, 
  Sparkles,
  Layers,
  Subtitles
} from 'lucide-react';
import { LessonContent, VideoConfig } from '../../types/lesson';

interface VideoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonContent;
  config: VideoConfig;
}

export const VideoExportModal: React.FC<VideoExportModalProps> = ({
  isOpen,
  onClose,
  lesson,
  config
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('Sẵn sàng xuất bản');
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const startExportPipeline = () => {
    setIsExporting(true);
    setIsCompleted(false);
    setExportProgress(10);
    setCurrentStep('1/4: Đang dựng khung hình đồ họa & chữ Hán...');

    setTimeout(() => {
      setExportProgress(40);
      setCurrentStep('2/4: Đang tổng hợp giọng đọc AI chuẩn Bắc Kinh (TTS)...');
    }, 1000);

    setTimeout(() => {
      setExportProgress(75);
      setCurrentStep('3/4: Đang đồng bộ phụ đề song ngữ Hán - Việt & Pinyin...');
    }, 2200);

    setTimeout(() => {
      setExportProgress(100);
      setCurrentStep('4/4: Đã đóng gói hoàn tất file MP4!');
      setIsExporting(false);
      setIsCompleted(true);
    }, 3200);
  };

  // Tạo và tải file phụ đề SRT thực tế
  const downloadSrtSubtitles = () => {
    let srtText = '';
    let counter = 1;
    let currentSec = 0;

    // Intro subtitle
    srtText += `${counter}\n00:00:00,000 --> 00:00:04,000\n${lesson.title}\n${lesson.topic}\n\n`;
    counter++;
    currentSec += 4;

    // Vocab subtitles
    lesson.vocabItems.forEach((item) => {
      const start = currentSec;
      const end = currentSec + config.pauseInterval + 3;
      const startStr = `00:${Math.floor(start / 60).toString().padStart(2, '0')}:${(start % 60).toString().padStart(2, '0')},000`;
      const endStr = `00:${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')},000`;

      srtText += `${counter}\n${startStr} --> ${endStr}\n${item.chinese} [${item.pinyin}]\n${item.vietnamese}\n\n`;
      counter++;
      currentSec = end;
    });

    // Dialogue subtitles
    lesson.dialogue.forEach((line) => {
      const start = currentSec;
      const end = currentSec + 4;
      const startStr = `00:${Math.floor(start / 60).toString().padStart(2, '0')}:${(start % 60).toString().padStart(2, '0')},000`;
      const endStr = `00:${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')},000`;

      srtText += `${counter}\n${startStr} --> ${endStr}\n${line.speaker}: ${line.chinese} (${line.pinyin})\n${line.vietnamese}\n\n`;
      counter++;
      currentSec = end;
    });

    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phu_de_${lesson.id}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tải tài liệu PDF / Text ôn tập
  const downloadHandout = () => {
    let content = `TÀI LIỆU BÀI GIẢNG TIẾNG TRUNG\n`;
    content += `Tiêu đề: ${lesson.title}\n`;
    content += `Cấp độ: ${lesson.level} | Chủ đề: ${lesson.topic}\n\n`;
    content += `I. DANH SÁCH TỪ VỰNG TRỌNG TÂM:\n`;
    lesson.vocabItems.forEach((item, idx) => {
      content += `${idx + 1}. ${item.chinese} (${item.pinyin}) - ${item.vietnamese}`;
      if (item.traditionalChinese && item.traditionalChinese !== item.chinese) {
        content += ` [Phồn thể: ${item.traditionalChinese}]`;
      }
      content += ` [${item.partOfSpeech} | ${item.level}]\n`;
      if (item.exampleChinese) {
        content += `   Ví dụ: ${item.exampleChinese}\n`;
        content += `   Phiên âm: ${item.examplePinyin}\n`;
        content += `   Dịch nghĩa: ${item.exampleVietnamese}\n`;
      }
      if (item.usageNote) {
        content += `   Ghi chú: ${item.usageNote}\n`;
      }
      content += `\n`;
    });

    content += `II. ĐỐI THOẠI ỨNG DỤNG:\n`;
    lesson.dialogue.forEach((line) => {
      content += `${line.speaker}: ${line.chinese} (${line.pinyin}) -> ${line.vietnamese}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tai_lieu_hoc_${lesson.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xuất bản video bài giảng
              </h3>
              <p className="text-xs text-slate-500">
                Đóng gói thành phẩm MP4, phụ đề SRT và tài liệu đính kèm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration summary */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Thông số kỹ thuật video
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div>
              Định dạng: <strong>MP4 (H.264 / AAC)</strong>
            </div>
            <div>
              Tỷ lệ: <strong>{config.aspectRatio === '16:9' ? '16:9 (Ngang)' : '9:16 (Dọc TikTok)'}</strong>
            </div>
            <div>
              Độ phân giải: <strong>{config.resolution.toUpperCase()}</strong>
            </div>
            <div>
              Giọng đọc AI: <strong>{config.voice === 'female_kore' ? 'Nữ Bắc Kinh' : 'Nam Bắc Kinh'}</strong>
            </div>
            <div>
              Số từ vựng: <strong>{lesson.vocabItems.length} từ</strong>
            </div>
            <div>
              Phụ đề song ngữ: <strong>{config.showPinyin ? 'Hán + Pinyin + Việt' : 'Hán + Việt'}</strong>
            </div>
          </div>
        </div>

        {/* Export Progress or Ready State */}
        {isExporting ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{currentStep}</span>
              <span className="font-mono tabular-nums text-rose-600 font-bold">{exportProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-600 h-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Hệ thống đang render khung hình và tổng hợp luồng audio. Vui lòng giữ cửa sổ mở.
            </p>
          </div>
        ) : isCompleted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Xuất bản video thành công!
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Các gói tài nguyên của bài học đã sẵn sàng để bạn tải về máy.
              </p>
            </div>

            {/* Download Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  alert('Video mô phỏng đã được xuất và sẵn sàng phát trên thiết bị của bạn!');
                }}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Tải Video MP4</span>
              </button>

              <button
                onClick={downloadSrtSubtitles}
                className="p-2.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Subtitles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tải Phụ đề SRT</span>
              </button>

              <button
                onClick={downloadHandout}
                className="p-2.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tài liệu học</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={startExportPipeline}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Bắt đầu kết xuất Video & Xuất bản</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Video sẽ được xuất với chuẩn nén tối ưu dung lượng cho học tập trực tuyến.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
