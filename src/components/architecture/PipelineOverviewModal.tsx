import React from 'react';
import { X, CheckCircle2, Layers, Cpu, Code2, ArrowRight } from 'lucide-react';
import { PIPELINE_STAGES } from '../../services/pipelineStages';

interface PipelineOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineOverviewModal: React.FC<PipelineOverviewModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kiến trúc module 8 bước mở rộng (Extensible Pipeline Architecture)
              </h3>
              <p className="text-xs text-slate-500">
                Hệ thống phân rã component & service chuẩn bị cho tích hợp toàn diện Gemini AI
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

        {/* Introduction */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-900">
            Cấu trúc phân rã độc lập - Không gom vào một file đơn lẻ:
          </p>
          <p>
            Mỗi giai đoạn trong quy trình 8 bước được đóng gói thành các component và service chuyên trách riêng biệt, cho phép nâng cấp độc lập từ phiên bản giao diện sang kết nối API mô hình Gemini 3.8 Flash, Gemini Vision OCR và Gemini Flash TTS.
          </p>
        </div>

        {/* 8 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.id}
              className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 font-mono">
                  GIAI ĐOẠN 0{stage.stepNumber}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã hoàn thiện cấu trúc</span>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {stage.name}
                </h4>
                <div className="text-xs text-slate-500 font-medium">
                  {stage.subtitle}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-normal">
                {stage.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[200px]">{stage.moduleFile}</span>
                </span>
                <span className="text-rose-600 font-medium">v1.0 Ready</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Chinese Video Lesson Maker · Phiên bản kiến trúc khởi tạo
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Đã hiểu & Tiếp tục làm việc
          </button>
        </div>

      </div>
    </div>
  );
};
