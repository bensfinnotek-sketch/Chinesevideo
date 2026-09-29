import React from 'react';
import { Volume2 } from 'lucide-react';
import { DialogueTurn } from '../../services/dialogueParser';
import { speakChinese } from '../../services/audioSynthesis';

interface DialogueTurnRendererProps {
  turn: DialogueTurn;
  activeTokenIndex?: number | null;
  isSentenceHighlighted?: boolean;
  highlightMode: 'word' | 'phrase' | 'sentence' | 'none';
  onWordClick?: (word: string, index: number) => void;
  showPinyin?: boolean;
  showVietnamese?: boolean;
  colorTheme?: 'warm_paper' | 'clean_white' | 'studio_dark';
}

export const DialogueTurnRenderer: React.FC<DialogueTurnRendererProps> = ({
  turn,
  activeTokenIndex = null,
  isSentenceHighlighted = false,
  highlightMode,
  onWordClick,
  showPinyin = true,
  showVietnamese = true,
  colorTheme = 'warm_paper',
}) => {
  const isDark = colorTheme === 'studio_dark';

  // Theme styling for YouTube Edu style
  const containerClasses = isDark
    ? isSentenceHighlighted
      ? 'bg-slate-900/90 border-rose-500/60 shadow-lg'
      : 'bg-slate-900/40 border-slate-800'
    : isSentenceHighlighted
      ? 'bg-amber-50/80 border-amber-300 shadow-md ring-1 ring-amber-300/40'
      : colorTheme === 'warm_paper'
        ? 'bg-[#FCFBF7] border-[#ECE7DA]'
        : 'bg-white border-slate-200';

  const characterBadgeClasses = isDark
    ? 'text-rose-400 bg-rose-950/60 border border-rose-900/80'
    : 'text-rose-800 bg-rose-50 border border-rose-200/80';

  const chineseTextClasses = isDark
    ? 'text-slate-100'
    : 'text-[#191919]';

  const pinyinTextClasses = isDark
    ? 'text-rose-400'
    : 'text-rose-700';

  const vietnameseTextClasses = isDark
    ? 'text-slate-300'
    : 'text-slate-600';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 ${containerClasses}`}
    >
      <div className="space-y-2.5">
        
        {/* DÒNG 1: TÊN NHÂN VẬT: + CHINESE (Font lớn, CJK rõ nét, màu tối, highlight từ/cụm) */}
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          {turn.characterName && (
            <span
              className={`text-sm sm:text-base font-bold font-sans px-2.5 py-0.5 rounded-md inline-block select-none shrink-0 ${characterBadgeClasses}`}
            >
              {turn.characterName}：
            </span>
          )}

          <div
            className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-wide leading-relaxed font-sans inline-flex flex-wrap items-center ${chineseTextClasses}`}
            style={{ fontFamily: `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif` }}
          >
            {turn.tokens.map((token, idx) => {
              const isTokenActive =
                activeTokenIndex === token.index ||
                (highlightMode === 'phrase' && token.isHighlight) ||
                (highlightMode === 'word' && activeTokenIndex === token.index);

              return (
                <span
                  key={idx}
                  onClick={() => onWordClick && onWordClick(token.text, token.index)}
                  className={`cursor-pointer px-1 py-0.5 rounded transition-all duration-200 ease-out select-text ${
                    isTokenActive
                      ? isDark
                        ? 'bg-rose-600 text-white shadow-sm scale-[1.03] ring-2 ring-rose-400/50'
                        : 'bg-amber-300 text-slate-950 font-extrabold shadow-xs scale-[1.02] ring-2 ring-amber-400/60'
                      : token.isHighlight && highlightMode !== 'none'
                        ? isDark
                          ? 'border-b-2 border-rose-500/80 text-rose-300'
                          : 'border-b-2 border-amber-500/80 text-[#111827] bg-amber-50/60'
                        : 'hover:bg-slate-200/50'
                  }`}
                  title="Nhấn để nghe phát âm từ này"
                >
                  {token.text}
                </span>
              );
            })}

            {/* Nút phát âm trực tiếp câu thoại */}
            <button
              onClick={() => speakChinese(turn.chinese)}
              className="ml-2 inline-flex items-center text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-full hover:bg-slate-100/60"
              title="Nghe phát âm cả câu"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DÒNG 2: PINYIN (Font nhỏ hơn Chinese, có dấu thanh, dễ đọc) */}
        {showPinyin && turn.pinyin && (
          <div
            className={`text-sm sm:text-base md:text-lg font-mono font-medium tracking-wider leading-relaxed ${pinyinTextClasses}`}
          >
            {turn.characterName && (
              <span className="opacity-0 select-none mr-2">
                {turn.characterName}：
              </span>
            )}
            <span>{turn.pinyin}</span>
          </div>
        )}

        {/* DÒNG 3: NGHĨA TIẾNG VIỆT (Font nhỏ hơn Chinese, rõ ràng, khoảng cách hợp lý) */}
        {showVietnamese && turn.vietnamese && (
          <div
            className={`text-xs sm:text-sm md:text-base font-normal leading-relaxed italic ${vietnameseTextClasses}`}
          >
            {turn.characterName && (
              <span className="opacity-0 select-none mr-2">
                {turn.characterName}：
              </span>
            )}
            <span>{turn.vietnamese}</span>
          </div>
        )}

      </div>
    </div>
  );
};
