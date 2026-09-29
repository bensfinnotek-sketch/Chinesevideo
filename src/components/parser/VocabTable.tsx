import React, { useState } from 'react';
import { 
  Volume2, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Search, 
  Plus, 
  Check, 
  X,
  BookOpen,
  GripVertical,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { VocabItem, PartOfSpeech, PART_OF_SPEECH_LABELS } from '../../types/lesson';
import { speakChinese } from '../../services/audioSynthesis';

interface VocabTableProps {
  items: VocabItem[];
  onUpdateItem: (updated: VocabItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (item: VocabItem) => void;
  onReorderItems: (reordered: VocabItem[]) => void;
  onAnalyzeAI: () => void;
  onVerifyAI: () => void;
  isAnalyzing: boolean;
  isVerifying: boolean;
  onProceedToLesson: () => void;
}

export const VocabTable: React.FC<VocabTableProps> = ({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onReorderItems,
  onAnalyzeAI,
  onVerifyAI,
  isAnalyzing,
  isVerifying,
  onProceedToLesson,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VocabItem>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // New item form state
  const [newItemForm, setNewItemForm] = useState<Partial<VocabItem>>({
    chinese: '',
    traditionalChinese: '',
    pinyin: '',
    vietnamese: '',
    partOfSpeech: 'noun',
    level: 'HSK 1',
    exampleChinese: '',
    examplePinyin: '',
    exampleVietnamese: '',
    usageNote: '',
  });

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.chinese.toLowerCase().includes(term) ||
      (item.traditionalChinese && item.traditionalChinese.toLowerCase().includes(term)) ||
      item.pinyin.toLowerCase().includes(term) ||
      item.vietnamese.toLowerCase().includes(term) ||
      (item.exampleChinese && item.exampleChinese.toLowerCase().includes(term))
    );
  });

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);
    onReorderItems(newItems);
    setDraggedIndex(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, movedItem);
    onReorderItems(newItems);
  };

  // Editing handlers
  const startEdit = (item: VocabItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId || !editForm.chinese) return;
    const original = items.find((i) => i.id === editingId);
    if (!original) return;

    onUpdateItem({
      ...original,
      ...editForm,
      chinese: editForm.chinese.trim(),
      traditionalChinese: editForm.traditionalChinese?.trim() || original.traditionalChinese || '',
      pinyin: editForm.pinyin?.trim() || '',
      vietnamese: editForm.vietnamese?.trim() || '',
      partOfSpeech: editForm.partOfSpeech || original.partOfSpeech || 'other',
      level: editForm.level?.trim() || original.level || 'HSK 1',
      exampleChinese: editForm.exampleChinese?.trim() || '',
      examplePinyin: editForm.examplePinyin?.trim() || '',
      exampleVietnamese: editForm.exampleVietnamese?.trim() || '',
      usageNote: editForm.usageNote?.trim() || '',
    });

    setEditingId(null);
    setEditForm({});
  };

  // Add new item submit
  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.chinese?.trim()) return;

    const newItem: VocabItem = {
      id: `manual-${Date.now()}`,
      chinese: newItemForm.chinese.trim(),
      traditionalChinese: newItemForm.traditionalChinese?.trim() || newItemForm.chinese.trim(),
      pinyin: newItemForm.pinyin?.trim() || '',
      vietnamese: newItemForm.vietnamese?.trim() || '',
      partOfSpeech: newItemForm.partOfSpeech || 'noun',
      level: newItemForm.level?.trim() || 'HSK 1',
      exampleChinese: newItemForm.exampleChinese?.trim() || '',
      examplePinyin: newItemForm.examplePinyin?.trim() || '',
      exampleVietnamese: newItemForm.exampleVietnamese?.trim() || '',
      usageNote: newItemForm.usageNote?.trim() || '',
      isAiVerified: false,
      verificationNotes: 'Được tạo thủ công bởi người dùng',
    };

    onAddItem(newItem);
    setNewItemForm({
      chinese: '',
      traditionalChinese: '',
      pinyin: '',
      vietnamese: '',
      partOfSpeech: 'noun',
      level: 'HSK 1',
      exampleChinese: '',
      examplePinyin: '',
      exampleVietnamese: '',
      usageNote: '',
    });
    setIsAddingNew(false);
  };

  const allPartsOfSpeech: PartOfSpeech[] = [
    'noun',
    'verb',
    'adjective',
    'adverb',
    'measure_word',
    'pronoun',
    'preposition',
    'conjunction',
    'phrase',
    'sentence',
    'other',
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & AI Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Dữ liệu bài giảng tiếng Trung</span>
            <span className="text-xs font-mono tabular-nums text-slate-500 font-normal">
              ({items.length} mục)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu đã được phân tích theo chuẩn bài học: Hán tự, Pinyin, Dịch nghĩa tự nhiên, Loại từ, Cấp độ và Câu ví dụ.
          </p>
        </div>

        {/* Primary AI Actions: Analyze & AI Kiểm tra lại */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút AI kiểm tra lại */}
          <button
            onClick={onVerifyAI}
            disabled={isVerifying || items.length === 0}
            title="Gemini rà soát lỗi chính tả, Pinyin, câu ví dụ và nghĩa tiếng Việt"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 text-emerald-600 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Đang kiểm tra lỗi...' : 'AI kiểm tra lại'}</span>
          </button>

          {/* Nút AI Phân tích & Chuẩn hóa */}
          <button
            onClick={onAnalyzeAI}
            disabled={isAnalyzing || items.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Gemini đang phân tích...' : 'Gemini phân tích & Chuẩn hóa'}</span>
          </button>

          {/* Nút Thêm mục */}
          <button
            onClick={() => setIsAddingNew(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mục</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo chữ Hán, Pinyin, nghĩa tiếng Việt, ví dụ..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-rose-500 focus:outline-none text-xs"
          />
        </div>

        <div className="text-slate-400 text-xs hidden sm:block">
          Mẹo: Kéo biểu tượng <GripVertical className="w-3 h-3 inline text-slate-400" /> để đổi thứ tự xuất hiện trong bài giảng
        </div>
      </div>

      {/* Add New Item Form Drawer */}
      {isAddingNew && (
        <form
          onSubmit={handleAddNewSubmit}
          className="p-5 bg-slate-50 border border-slate-300 rounded-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Thêm mục từ vựng / câu mới
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Chữ Trung (chinese) *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 苹果"
                value={newItemForm.chinese || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, chinese: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Chữ Phồn thể (traditionalChinese)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 蘋果"
                value={newItemForm.traditionalChinese || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, traditionalChinese: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Phiên âm (pinyin)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: píngguǒ"
                value={newItemForm.pinyin || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, pinyin: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nghĩa tiếng Việt (vietnamese)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Quả táo, trái táo"
                value={newItemForm.vietnamese || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, vietnamese: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Loại từ (partOfSpeech)
              </label>
              <select
                value={newItemForm.partOfSpeech}
                onChange={(e) => setNewItemForm({ ...newItemForm, partOfSpeech: e.target.value as PartOfSpeech })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              >
                {allPartsOfSpeech.map((pos) => (
                  <option key={pos} value={pos}>
                    {PART_OF_SPEECH_LABELS[pos]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Cấp độ (level)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: HSK 1, HSK 2, Giao tiếp"
                value={newItemForm.level || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, level: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-700 block">
              Câu ví dụ minh họa & Nghĩa tiếng Việt
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Ví dụ tiếng Trung (exampleChinese)"
                value={newItemForm.exampleChinese || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, exampleChinese: e.target.value })}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Pinyin ví dụ (examplePinyin)"
                value={newItemForm.examplePinyin || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, examplePinyin: e.target.value })}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none font-mono"
              />
              <input
                type="text"
                placeholder="Dịch nghĩa ví dụ (exampleVietnamese)"
                value={newItemForm.exampleVietnamese || ''}
                onChange={(e) => setNewItemForm({ ...newItemForm, exampleVietnamese: e.target.value })}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ghi chú ngữ pháp & Mẹo dùng (usageNote)
            </label>
            <input
              type="text"
              placeholder="Ghi chú ngữ pháp, cách phối hợp từ..."
              value={newItemForm.usageNote || ''}
              onChange={(e) => setNewItemForm({ ...newItemForm, usageNote: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs"
            >
              Lưu vào bài học
            </button>
          </div>
        </form>
      )}

      {/* Main Vocabulary Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-900">
            Chưa có từ vựng nào phù hợp
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vui lòng nhập thêm từ vựng hoặc nạp file tài liệu ở bước trước.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 w-40">Chữ Hán (chinese)</th>
                  <th className="py-3 px-3 w-32">Pinyin</th>
                  <th className="py-3 px-3 w-48">Nghĩa tiếng Việt</th>
                  <th className="py-3 px-3 w-28">Loại từ</th>
                  <th className="py-3 px-3 min-w-[260px]">Câu ví dụ & Nghĩa</th>
                  <th className="py-3 px-3 w-44">Thẩm định AI</th>
                  <th className="py-3 px-3 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredItems.map((item, index) => {
                  const isEditing = editingId === item.id;

                  // ROW EDITING MODE
                  if (isEditing) {
                    return (
                      <tr key={item.id} className="bg-rose-50/40">
                        <td className="py-3 px-3 text-center text-xs font-mono text-slate-400">
                          {index + 1}
                        </td>
                        {/* Chinese & Traditional */}
                        <td className="py-3 px-3 space-y-1">
                          <input
                            type="text"
                            value={editForm.chinese || ''}
                            onChange={(e) => setEditForm({ ...editForm, chinese: e.target.value })}
                            className="w-full px-2 py-1 text-sm bg-white border border-slate-300 rounded font-bold"
                            placeholder="Giản thể"
                          />
                          <input
                            type="text"
                            value={editForm.traditionalChinese || ''}
                            onChange={(e) => setEditForm({ ...editForm, traditionalChinese: e.target.value })}
                            className="w-full px-2 py-0.5 text-xs bg-white border border-slate-200 rounded text-slate-500"
                            placeholder="Phồn thể"
                          />
                        </td>

                        {/* Pinyin */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={editForm.pinyin || ''}
                            onChange={(e) => setEditForm({ ...editForm, pinyin: e.target.value })}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono text-rose-700 font-semibold"
                            placeholder="Pinyin có dấu"
                          />
                        </td>

                        {/* Vietnamese */}
                        <td className="py-3 px-3 space-y-1">
                          <textarea
                            value={editForm.vietnamese || ''}
                            onChange={(e) => setEditForm({ ...editForm, vietnamese: e.target.value })}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                            rows={2}
                            placeholder="Nghĩa tiếng Việt tự nhiên"
                          />
                        </td>

                        {/* Part of Speech & Level */}
                        <td className="py-3 px-3 space-y-1">
                          <select
                            value={editForm.partOfSpeech || 'noun'}
                            onChange={(e) => setEditForm({ ...editForm, partOfSpeech: e.target.value as PartOfSpeech })}
                            className="w-full px-1.5 py-1 text-[11px] bg-white border border-slate-300 rounded"
                          >
                            {allPartsOfSpeech.map((pos) => (
                              <option key={pos} value={pos}>
                                {PART_OF_SPEECH_LABELS[pos]}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editForm.level || ''}
                            onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                            className="w-full px-1.5 py-0.5 text-[11px] bg-white border border-slate-200 rounded"
                            placeholder="Cấp độ (HSK)"
                          />
                        </td>

                        {/* Example Chinese, Pinyin, Vietnamese */}
                        <td className="py-3 px-3 space-y-1">
                          <input
                            type="text"
                            value={editForm.exampleChinese || ''}
                            onChange={(e) => setEditForm({ ...editForm, exampleChinese: e.target.value })}
                            className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-medium"
                            placeholder="Câu ví dụ tiếng Trung"
                          />
                          <input
                            type="text"
                            value={editForm.examplePinyin || ''}
                            onChange={(e) => setEditForm({ ...editForm, examplePinyin: e.target.value })}
                            className="w-full px-2 py-0.5 text-[11px] bg-white border border-slate-200 rounded font-mono text-slate-500"
                            placeholder="Pinyin câu ví dụ"
                          />
                          <input
                            type="text"
                            value={editForm.exampleVietnamese || ''}
                            onChange={(e) => setEditForm({ ...editForm, exampleVietnamese: e.target.value })}
                            className="w-full px-2 py-0.5 text-[11px] bg-white border border-slate-200 rounded italic"
                            placeholder="Dịch nghĩa câu ví dụ"
                          />
                        </td>

                        {/* Usage Note */}
                        <td className="py-3 px-3">
                          <textarea
                            value={editForm.usageNote || ''}
                            onChange={(e) => setEditForm({ ...editForm, usageNote: e.target.value })}
                            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded"
                            rows={2}
                            placeholder="Ghi chú ngữ pháp"
                          />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={saveEdit}
                              title="Lưu thay đổi"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              title="Hủy bỏ"
                              className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // ROW DISPLAY MODE (with Drag & Drop)
                  return (
                    <tr
                      key={item.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`hover:bg-slate-50/80 transition-colors group cursor-default ${
                        draggedIndex === index ? 'opacity-40 bg-rose-50' : ''
                      }`}
                    >
                      {/* Drag Handle & Order */}
                      <td className="py-3 px-2 text-center text-xs">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5"
                            title="Kéo thả để đổi thứ tự"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                            {index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Chinese & Traditional */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-base font-bold text-slate-900 tracking-wide font-sans">
                              {item.chinese}
                            </div>
                            {item.traditionalChinese && item.traditionalChinese !== item.chinese && (
                              <div className="text-[11px] text-slate-400">
                                Phồn thể: <span className="font-serif">{item.traditionalChinese}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => speakChinese(item.chinese)}
                            title="Phát âm chuẩn tiếng Trung"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-70 group-hover:opacity-100"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Pinyin */}
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono text-rose-700 tracking-wide font-semibold">
                          {item.pinyin || (
                            <span className="text-amber-600 italic font-normal">Chờ AI</span>
                          )}
                        </span>
                      </td>

                      {/* Vietnamese Meaning */}
                      <td className="py-3 px-3">
                        <div className="text-xs text-slate-900 font-medium leading-relaxed">
                          {item.vietnamese || (
                            <span className="text-amber-600 italic font-normal">Chờ AI dịch</span>
                          )}
                        </div>
                        {item.usageNote && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {item.usageNote}
                          </div>
                        )}
                      </td>

                      {/* Part of Speech & Level */}
                      <td className="py-3 px-3">
                        <div className="text-xs text-slate-700">
                          {PART_OF_SPEECH_LABELS[item.partOfSpeech] || item.partOfSpeech}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.level || 'HSK 1'}
                        </div>
                      </td>

                      {/* Example sentence with audio */}
                      <td className="py-3 px-3">
                        {item.exampleChinese ? (
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                              <span>{item.exampleChinese}</span>
                              <button
                                onClick={() => speakChinese(item.exampleChinese)}
                                title="Nghe câu ví dụ"
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Volume2 className="w-3 h-3" />
                              </button>
                            </div>
                            {item.examplePinyin && (
                              <div className="text-[11px] text-slate-400 font-mono">
                                {item.examplePinyin}
                              </div>
                            )}
                            {item.exampleVietnamese && (
                              <div className="text-[11px] text-slate-600 italic">
                                {item.exampleVietnamese}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có ví dụ</span>
                        )}
                      </td>

                      {/* AI Verification Status */}
                      <td className="py-3 px-3">
                        {item.isAiVerified ? (
                          <div className="text-xs space-y-0.5">
                            <div className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Đã kiểm tra</span>
                            </div>
                            {item.verificationNotes && (
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {item.verificationNotes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Chưa kiểm duyệt</span>
                          </div>
                        )}
                      </td>

                      {/* Actions: Edit, Delete, Move Up/Down */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Move up / down buttons */}
                          <button
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            title="Di chuyển lên trên"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === items.length - 1}
                            title="Di chuyển xuống dưới"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => startEdit(item)}
                            title="Chỉnh sửa mục"
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            title="Xóa mục"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Hiển thị <span className="font-mono tabular-nums font-semibold text-slate-800">{filteredItems.length}</span> / {items.length} mục từ vựng
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onProceedToLesson}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors shadow-2xs"
              >
                <span>Xem trước kịch bản bài giảng →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
