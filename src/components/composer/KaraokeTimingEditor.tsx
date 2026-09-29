import React, { useEffect, useMemo, useState } from 'react';
import { Check, GitMerge, Scissors, Trash2, Magnet, Wand2 } from 'lucide-react';
import { KaraokeToken } from '../../services/audioEngine/types';

interface KaraokeTimingEditorProps {
  tokens: KaraokeToken[];
  duration: number;
  currentTime: number;
  onChange: (tokens: KaraokeToken[]) => void;
  onPlayPhrase: (startTime: number, endTime: number) => void;
  onAutoGenerate: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const KaraokeTimingEditor: React.FC<KaraokeTimingEditorProps> = ({
  tokens,
  duration,
  currentTime,
  onChange,
  onPlayPhrase,
  onAutoGenerate,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [snapEnabled, setSnapEnabled] = useState(true);

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

  const getSnapPoints = () => [
    0,
    ...safeTokens.flatMap(token => [token.start, token.end]),
    duration,
  ];

  const snapTime = (value: number, min: number, max: number) => {
    const clamped = clamp(value, min, max);
    if (!snapEnabled) return clamped;
    const threshold = Math.max(0.08, duration * 0.008);
    const nearest = getSnapPoints()
      .filter(point => point >= min && point <= max)
      .sort((a, b) => Math.abs(a - clamped) - Math.abs(b - clamped))[0];
    return nearest !== undefined && Math.abs(nearest - clamped) <= threshold ? nearest : clamped;
  };

  const beginDrag = (tokenIndex: number, kind: 'start' | 'end') => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const track = event.currentTarget.parentElement?.parentElement;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const token = safeTokens[tokenIndex];
    if (!token) return;
    setSelectedIndex(tokenIndex);

    const handleMove = (moveEvent: PointerEvent) => {
      const ratio = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);
      const value = ratio * duration;
      const previous = safeTokens[tokenIndex - 1];
      const nextToken = safeTokens[tokenIndex + 1];

      if (kind === 'start') {
        const min = previous ? previous.end + 0.01 : 0;
        const max = token.end - 0.01;
        emit(safeTokens.map((item, itemIndex) => itemIndex === tokenIndex ? { ...item, start: snapTime(value, min, max) } : item));
      } else {
        const min = token.start + 0.01;
        const max = nextToken ? nextToken.start - 0.01 : duration;
        emit(safeTokens.map((item, itemIndex) => itemIndex === tokenIndex ? { ...item, end: snapTime(value, min, max) } : item));
      }
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
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
        <div className="flex items-center gap-2">
          <button
            onClick={onAutoGenerate}
            className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700 hover:bg-violet-100 flex items-center gap-1"
            title="Tạo lại phrase timing từ các đoạn thoại hiện có, không tạo lại Audio"
          >
            <Wand2 className="w-3 h-3" /> Tạo phrase thông minh
          </button>
          <button
            onClick={() => setSnapEnabled(value => !value)}
            className={`rounded-lg border px-2 py-1 text-[9px] font-semibold flex items-center gap-1 ${snapEnabled ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500'}`}
            title="Bám theo ranh giới phrase"
          >
            <Magnet className="w-3 h-3" /> Snap {snapEnabled ? 'ON' : 'OFF'}
          </button>
          <span className="text-[10px] font-mono text-slate-500">{currentTime.toFixed(2)}s</span>
        </div>
      </div>

      <div className="relative h-10 rounded-lg bg-white border border-rose-100 overflow-hidden select-none touch-none">
        {safeTokens.map((token, index) => {
          const left = (token.start / duration) * 100;
          const width = Math.max(1, ((token.end - token.start) / duration) * 100);
          const active = currentTime >= token.start && currentTime <= token.end;
          const selectedNow = selected?.index === token.index;
          return (
            <div
              key={token.index}
              onClick={() => { setSelectedIndex(index); setDraftText(token.text); onPlayPhrase(token.start, token.end); }}
              className={"absolute top-0 h-full border-r border-white/70 px-1 text-[9px] font-semibold truncate cursor-pointer transition-colors " + (active ? 'bg-rose-500 text-white' : selectedNow ? 'bg-rose-200 text-rose-900' : 'bg-slate-200 text-slate-700')}
              style={{ left: left + '%', width: width + '%' }}
              title={token.text + ' · ' + token.start.toFixed(2) + '–' + token.end.toFixed(2) + 's · click để phát'}
            >
              {token.text}
              <span
                onPointerDown={beginDrag(index, 'start')}
                className="absolute left-0 top-0 z-10 h-full w-2 cursor-ew-resize bg-transparent hover:bg-rose-700/30"
                aria-label={"Kéo điểm bắt đầu " + token.text}
              />
              <span
                onPointerDown={beginDrag(index, 'end')}
                className="absolute right-0 top-0 z-10 h-full w-2 cursor-ew-resize bg-transparent hover:bg-rose-700/30"
                aria-label={"Kéo điểm kết thúc " + token.text}
              />
            </div>
          );
        })}
        <div
          className="pointer-events-none absolute top-0 h-full w-px bg-black/70 z-20"
          style={{ left: clamp((currentTime / duration) * 100, 0, 100) + '%' }}
        />
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

          <button onClick={() => onPlayPhrase(selected.start, selected.end)} className="w-full rounded-lg bg-rose-600 text-white px-2 py-1.5 text-[10px] font-bold hover:bg-rose-700 flex items-center justify-center gap-1">
            ▶ Phát từ phrase này
          </button>

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
