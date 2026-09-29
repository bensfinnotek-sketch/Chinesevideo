import React from 'react';
import { 
  UploadCloud, 
  FileText, 
  BookOpen, 
  Sliders, 
  PlaySquare, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Headphones,
  Film
} from 'lucide-react';
import { PIPELINE_STAGES } from '../../services/pipelineStages';

interface SidebarProps {
  activeTab: 'import' | 'parser' | 'lesson' | 'audio' | 'visual' | 'composer' | 'config' | 'preview';
  setActiveTab: (tab: 'import' | 'parser' | 'lesson' | 'audio' | 'visual' | 'composer' | 'config' | 'preview') => void;
  vocabCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  estimatedDurationSeconds: number;
  onOpenArchitecture: () => void;
  onAnalyzeAI: () => void;
  onVerifyAI: () => void;
  isAnalyzing: boolean;
  isVerifying: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  vocabCount,
  verifiedCount,
  unverifiedCount,
  estimatedDurationSeconds,
  onOpenArchitecture,
  onAnalyzeAI,
  onVerifyAI,
  isAnalyzing,
  isVerifying,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const navItems = [
    {
      id: 'import' as const,
      label: 'Nạp dữ liệu & Tài liệu',
      desc: 'Upload file hoặc gõ trực tiếp',
      icon: UploadCloud,
      count: null,
    },
    {
      id: 'parser' as const,
      label: 'Dữ liệu nhận dạng',
      desc: 'Hán tự, Pinyin, Nghĩa, Ví dụ',
      icon: FileText,
      count: vocabCount,
    },
    {
      id: 'lesson' as const,
      label: 'Cấu trúc bài giảng',
      desc: 'Giới thiệu, Flashcard, Đối thoại',
      icon: BookOpen,
      count: null,
    },
    {
      id: 'audio' as const,
      label: 'Phòng thu TTS / Giọng AI',
      desc: 'Gemini TTS Mandarin & Việt Nam',
      icon: Headphones,
      count: null,
    },
    {
      id: 'visual' as const,
      label: 'Visual Generator',
      desc: 'AI Image, Veo Video & B-roll',
      icon: Film,
      count: null,
    },
    {
      id: 'composer' as const,
      label: 'Video Composer (MP4)',
      desc: 'Dựng 10 layer, 24fps & Nối Scenes',
      icon: Layers,
      count: null,
    },
    {
      id: 'config' as const,
      label: 'Cấu hình video',
      desc: 'Định dạng 16:9 / 9:16, Giao diện',
      icon: Sliders,
      count: null,
    },
    {
      id: 'preview' as const,
      label: 'Trình phát xem trước',
      desc: 'Mô phỏng video & Nghe thử',
      icon: PlaySquare,
      count: null,
    },
  ];

  return (
    <aside className="w-64 lg:w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Navigation List */}
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 px-2">
            Quy trình biên soạn
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-rose-50 text-rose-950 font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">{item.label}</span>
                      {item.count !== null && item.count > 0 && (
                        <span className="text-xs font-mono tabular-nums text-slate-500 ml-1.5">
                          {item.count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Lesson Stats */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 px-2">
            Thống kê nội dung
          </div>
          <div className="bg-slate-50 rounded-lg p-3 space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Tổng số mục từ/câu</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {vocabCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI đã thẩm định</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-emerald-700">
                {verifiedCount}
              </span>
            </div>

            {unverifiedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chờ phân tích</span>
                </span>
                <span className="font-mono tabular-nums font-semibold text-amber-700">
                  {unverifiedCount}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Thời lượng video ước tính</span>
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {formatTime(estimatedDurationSeconds)}
              </span>
            </div>
          </div>

          {/* Quick AI Actions */}
          <div className="mt-3 space-y-2">
            <button
              onClick={onVerifyAI}
              disabled={isVerifying || vocabCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <ShieldCheck className={`w-3.5 h-3.5 text-emerald-600 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Đang kiểm tra lỗi...' : 'AI kiểm tra lại'}</span>
            </button>

            <button
              onClick={onAnalyzeAI}
              disabled={isAnalyzing || vocabCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Đang phân tích...' : 'Gemini phân tích chuẩn'}</span>
            </button>
          </div>
        </div>

        {/* 8-Stage Architecture status */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Pipeline: Upload → Parse → AI Analyze
            </span>
            <button
              onClick={onOpenArchitecture}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Chi tiết
            </button>
          </div>
          <div className="space-y-1">
            {PIPELINE_STAGES.slice(0, 4).map((stage) => (
              <div
                key={stage.id}
                className="flex items-center justify-between px-2 py-1 text-xs text-slate-600"
              >
                <span className="truncate">
                  {stage.stepNumber}. {stage.name}
                </span>
                <span className="text-[10px] text-emerald-600 font-mono">
                  Hoạt động
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50">
        <button
          onClick={onOpenArchitecture}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Mô hình Gemini 3.8 Flash</span>
          </span>
          <span className="text-emerald-600 font-mono text-[10px] font-bold">ACTIVE</span>
        </button>
      </div>
    </aside>
  );
};
