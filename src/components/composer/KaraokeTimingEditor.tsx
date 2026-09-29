import React, { useEffect, useMemo, useState } from 'react';
import { Check, GitMerge, Scissors, Trash2 } from 'lucide-react';
import { KaraokeToken } from '../../services/audioEngine/types';

interface KaraokeTimingEditorProps {
  tokens: KaraokeToken[];
  duration: number;
  currentTime: number;
  onChange: (tokens: KaraokeToken[]) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const KaraokeTimingEditor: React.FC<KaraokeTimingEditorProps> = ({
  tokens,
  duration,
  currentTime,
  onChange,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draftText, setDraftText] = useState('');

  const safeTokens = useMemo(
    () => tokens.map((token, index) => ({ ...token, index })).filter(token => token.end > token.start),
    [tokens]
  );
  const selected = safeTokens[selectedIndex] || safeTokens[0];

  useEffect(() => {
    setSelectedIndex(index => Math.min(index, Math.max(0, safeTokens.length - 1)));
    setDraftText(selected?.text || '');
  }, [safeTokens.length, selected?.text]);

  const emit = (next: KaraokeToken[]) => {
    const normalized = next
      .filter(token => token.text.trim() && token.end > token.start)
      .sort((a, b) => a.start - b.start)
      .map((token, index) => ({ ...token, index }));
    onChange(normalized);
  };

  const updateSelected = (patch: Partial<KaraokeToken>) => {
    if (!selected) return;
    emit(safeTokens.map(token => token.index === selected.index ? { ...token, ...patch } : token));
  };

  const updateBoundary = (kind: 'start' | 'end', value: number) => {
    if (!selected) return;
    const previous = safeTokens[selectedIndex - 1];
    const nextToken = safeTokens[selectedIndex + 1];
    const min = kind === 'start' ? (previous?.end ?? 0) + 0.01 : selected.start + 0.01;
    const max = kind === 'start' ? selected.end - 0.01 : (nextToken?.start ?? duration) - 0.01;
    updateSelected({ [kind]: clamp(value, Math.max(0, min), Math.min(duration, max)) } as Partial<KaraokeToken>);
  };

  const splitSelected = () => {
    if (!selected) return;
    const text = selected.text.trim();
    if (text.length < 2 || selected.end - selected.start < 0.1) return;
    const midpoint = selected.start + (selected.end - selected.start) / 2;
    const splitAt = Math.max(1, Math.floor(text.length / 2));
    emit([
      ...safeTokens.filter(token => token.index !== selected.index),
      { ...selected, text: text.slice(0, splitAt), end: midpoint },
      { ...selected, text: text.slice(splitAt), start: midpoint },
    ]);
    setSelectedIndex(Math.min(selectedIndex + 1, safeTokens.length - 1));
  };

  const mergeSelected = () => {
    if (!selected || selectedIndex >= safeTokens.length - 1) return;
    const next = safeTokens[selectedIndex + 1];
    emit([
      ...safeTokens.slice(0, selectedIndex),
      { ...selected, text: selected.text + next.text, end: Math.max(selected.end, next.end) },
      ...safeTokens.slice(selectedIndex + 2),
    ]);
  };

  const removeSelected = () => {
    if (!selected) return;
    emit(safeTokens.filter(token => token.index !== selected.index));
    setSelectedIndex(Math.max(0, selectedIndex - 1));
  };

  if (!safeTokens.length) {
    return <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-500">Chưa có phrase timing. Hãy tạo Audio cho Scene trước.</div>;
  }

  return (
    <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">Karaoke Timing Editor</div>
          <div className="text-[10px] text-rose-600/70">{safeTokens.length} phrase · chỉnh trực tiếp timeline</div>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{currentTime.toFixed(2)}s</span>
      </div>

      <div className="relative h-9 rounded-lg bg-white border border-rose-100 overflow-hidden">
        {safeTokens.map((token, index) => {
          const left = (token.start / duration) * 100;
          const width = Math.max(1, ((token.end - token.start) / duration) * 100);
          const active = currentTime >= token.start && currentTime <= token.end;
          const selectedNow = selected?.index === token.index;
          return (
            <button
              key={token.index}
              onClick={() => { setSelectedIndex(index); setDraftText(token.text); }}
              className={"absolute top-0 h-full border-r border-white/70 px-1 text-[9px] font-semibold truncate transition-colors " + (active ? 'bg-rose-500 text-white' : selectedNow ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-700')}
              style={{ left: left + '%', width: width + '%' }}
              title={token.text + ' · ' + token.start.toFixed(2) + '–' + token.end.toFixed(2) + 's'}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold text-slate-600">
              Bắt đầu
              <input type="number" step="0.01" min="0" max={duration} value={selected.start.toFixed(2)} onChange={e => updateBoundary('start', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-[10px]" />
            </label>
            <label className="text-[10px] font-semibold text-slate-600">
              Kết thúc
              <input type="number" step="0.01" min="0" max={duration} value={selected.end.toFixed(2)} onChange={e => updateBoundary('end', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-mono text-[10px]" />
            </label>
          </div>

          <label className="text-[10px] font-semibold text-slate-600 block">
            Phrase
            <input value={draftText} onChange={e => setDraftText(e.target.value)} onBlur={() => updateSelected({ text: draftText })} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800" />
          </label>

          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={splitSelected} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"><Scissors className="w-3 h-3" /> Split</button>
            <button onClick={mergeSelected} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"><GitMerge className="w-3 h-3" /> Merge</button>
            <button onClick={removeSelected} className="rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Xóa</button>
          </div>

          <div className="text-[9px] text-slate-400 flex items-center gap-1"><Check className="w-3 h-3" /> Mỗi thay đổi được lưu ngay vào Scene + Lesson JSON.</div>
        </div>
      )}
    </div>
  );
};
