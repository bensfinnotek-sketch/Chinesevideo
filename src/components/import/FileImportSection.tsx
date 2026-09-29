import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileCode
} from 'lucide-react';
import { VocabItem, UploadedFileSummary } from '../../types/lesson';
import { parseTextFile, parseImageFile, parseComplexDocFile } from '../../services/fileParser';
import { SAMPLE_PRESETS } from '../../services/dictionaryData';

interface FileImportSectionProps {
  onItemsImported: (items: VocabItem[], fileInfo?: UploadedFileSummary) => void;
  onSelectPreset: (presetIndex: number) => void;
}

export const FileImportSection: React.FC<FileImportSectionProps> = ({
  onItemsImported,
  onSelectPreset
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = ['.txt', '.csv', '.xlsx', '.docx', '.pdf', '.jpg', '.jpeg', '.png', '.webp'];

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setErrorMsg(null);
    setSuccessMsg(null);
    setImagePreview(null);
    setIsProcessing(true);

    try {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      let imported: VocabItem[] = [];

      if (['.txt', '.csv'].includes(ext)) {
        imported = await parseTextFile(file);
      } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        const { previewUrl, items } = await parseImageFile(file);
        setImagePreview(previewUrl);
        imported = items;
      } else if (['.xlsx', '.docx', '.pdf'].includes(ext)) {
        imported = await parseComplexDocFile(file);
      } else {
        throw new Error(`Định dạng ${ext} chưa được hỗ trợ. Vui lòng chọn file TXT, CSV, XLSX, DOCX, PDF hoặc Ảnh.`);
      }

      if (imported.length === 0) {
        throw new Error('Không tìm thấy từ vựng hoặc chữ Hán hợp lệ trong file. Vui lòng kiểm tra định dạng.');
      }

      const fileSummary: UploadedFileSummary = {
        name: file.name,
        size: file.size,
        type: file.type || ext,
        lastModified: file.lastModified,
        parsedCount: imported.length
      };

      onItemsImported(imported, fileSummary);
      setSuccessMsg(`Đã nhận dạng thành công ${imported.length} mục từ file "${file.name}".`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi đọc file.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Tải file mẫu CSV
  const downloadSampleCsv = () => {
    const csvContent = `chinese,pinyin,vietnamese,example\n` +
      `你好,nǐ hǎo,Xin chào,你好，很高兴认识你！\n` +
      `谢谢,xièxie,Cảm ơn,太谢谢你的帮助了。\n` +
      `咖啡,kāfēi,Cà phê,早上一杯热咖啡让人精神充沛。\n` +
      `朋友,péngyou,Bạn bè,他是我最好的中国朋友。\n` +
      `学习,xuéxí,Học tập,我每天努力学习汉语。`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_tu_vung_tieng_trung.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tải file mẫu TXT
  const downloadSampleTxt = () => {
    const txtContent = `# Danh sách từ vựng tiếng Trung (mỗi dòng 1 từ)\n` +
      `你好 - nǐ hǎo - Xin chào\n` +
      `谢谢 - xièxie - Cảm ơn\n` +
      `工作 - gōngzuò - Công việc\n` +
      `再见 - zài jiàn - Tạm biệt\n` +
      `买东西 - mǎi dōngxi - Mua sắm\n` +
      `多少钱 - duōshao qián - Bao nhiêu tiền?`;

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_tu_vung_tieng_trung.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Nạp tài liệu từ vựng & Câu tiếng Trung
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Hỗ trợ tự động trích xuất chữ Hán từ nhiều định dạng. Gemini AI sẽ phân tích và bổ sung Pinyin, dịch nghĩa nếu tài liệu chưa có sẵn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Tải mẫu CSV</span>
          </button>
          <button
            onClick={downloadSampleTxt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Tải mẫu TXT</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-rose-500 bg-rose-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-slate-400 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedExtensions.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6 text-slate-600" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Kéo thả tài liệu vào đây hoặc <span className="text-rose-600 underline">bấm để duyệt file</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Định dạng được hỗ trợ: TXT, CSV, XLSX, DOCX, PDF, hoặc Hình ảnh (JPG, PNG, WebP)
            </p>
          </div>

          {/* Formats badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
              .TXT
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
              .CSV
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
              .XLSX
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
              .DOCX
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
              .PDF
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
              .PNG / .JPG
            </span>
          </div>
        </div>
      </div>

      {/* Image Preview if uploaded */}
      {imagePreview && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
            <img src={imagePreview} alt="Tài liệu hình ảnh đã tải lên" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-rose-600" />
              <span>Đã nhận dạng ảnh chứa ký tự tiếng Trung</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Gemini Vision sẽ tiến hành OCR và trích xuất chữ Hán từ ảnh để tạo danh sách học tập.
            </p>
          </div>
        </div>
      )}

      {/* Feedback alerts */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sample Presets for Quick Testing */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Hoặc chọn dữ liệu mẫu có sẵn để trải nghiệm ngay:
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Nhấn để nạp tự động
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => onSelectPreset(index)}
              className="p-3.5 text-left bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                  {preset.label}
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {preset.items.length} từ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
