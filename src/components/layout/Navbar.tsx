import React from 'react';
import { Sparkles, Video, Play, Layers } from 'lucide-react';

interface NavbarProps {
  activeTab: 'import' | 'parser' | 'lesson' | 'audio' | 'visual' | 'composer' | 'config' | 'preview';
  setActiveTab: (tab: 'import' | 'parser' | 'lesson' | 'audio' | 'visual' | 'composer' | 'config' | 'preview') => void;
  onGenerateLesson: () => void;
  onOpenExport: () => void;
  onOpenArchitecture: () => void;
  vocabCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onGenerateLesson,
  onOpenExport,
  onOpenArchitecture,
  vocabCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark with domain personality */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('import')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              华
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Chinese Video Lesson Maker
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links with active state */}
        <nav className="hidden lg:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'import'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            1. Nạp tài liệu
          </button>

          <button
            onClick={() => setActiveTab('parser')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md flex items-center gap-1.5 ${
              activeTab === 'parser'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>2. Danh sách từ vựng</span>
            {vocabCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-slate-500">
                ({vocabCount})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('lesson')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'lesson'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            3. Soạn bài giảng
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md flex items-center gap-1 ${
              activeTab === 'audio'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>4. Phòng thu TTS</span>
          </button>

          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md flex items-center gap-1 ${
              activeTab === 'visual'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>5. Visual Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('composer')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
              activeTab === 'composer'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            6. Video Composer
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap rounded-md flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'text-rose-700 bg-rose-50/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>7. Xem trước video</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenArchitecture}
            title="Xem kiến trúc 8 bước mở rộng"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Kiến trúc hệ thống</span>
          </button>

          <button
            onClick={onGenerateLesson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Tạo bài giảng</span>
          </button>

          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Xuất video</span>
          </button>
        </div>

      </div>
    </header>
  );
};
