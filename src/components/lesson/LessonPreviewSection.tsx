import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Volume2, 
  MessageSquare, 
  CheckCircle2, 
  RotateCcw,
  BookOpen,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Check,
  X,
  VolumeX,
  UserCheck,
  Video,
  ListOrdered
} from 'lucide-react';
import { 
  LessonContent, 
  VocabItem, 
  LessonDurationTarget, 
  GeneratedLessonPlan, 
  LessonScene,
  SCENE_TYPE_TITLES 
} from '../../types/lesson';
import { speakChinese } from '../../services/audioSynthesis';
import { 
  partitionVocabIntoLessons, 
  requestLessonScript, 
  getRecommendedWordsPerLesson 
} from '../../services/lessonGeneratorService';

interface LessonPreviewSectionProps {
  lesson: LessonContent | null;
  items: VocabItem[];
  onGenerateLesson: () => void;
  isGenerating: boolean;
  onGoToVideoConfig: () => void;
  onSaveScriptToLesson?: (script: GeneratedLessonPlan) => void;
}

export const LessonPreviewSection: React.FC<LessonPreviewSectionProps> = ({
  lesson,
  items,
  onGenerateLesson,
  isGenerating,
  onGoToVideoConfig,
  onSaveScriptToLesson,
}) => {
  // Thời lượng mục tiêu: 3, 5, 10, 15 phút (mặc định 5 phút)
  const [targetDuration, setTargetDuration] = useState<LessonDurationTarget>(5);

  // Phân chia bài giảng thành các phần nhỏ
  const lessonChunks = partitionVocabIntoLessons(items, targetDuration);
  const [selectedChunkIndex, setSelectedChunkIndex] = useState(0);

  // Kịch bản 8 Scenes đã tạo
  const [lessonPlan, setLessonPlan] = useState<GeneratedLessonPlan | null>(lesson?.script || null);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  // Scene đang mở rộng hoặc chỉnh sửa
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [editingSceneData, setEditingSceneData] = useState<Partial<LessonScene>>({});

  // Cập nhật khi lesson thay đổi
  useEffect(() => {
    if (lesson?.script) {
      setLessonPlan(lesson.script);
    }
  }, [lesson]);

  // Tạo kịch bản bài giảng 8 SCENES cho chunk hiện tại
  const handleGenerateScript = async () => {
    const currentChunk = lessonChunks[selectedChunkIndex] || lessonChunks[0];
    if (!currentChunk || currentChunk.items.length === 0) return;

    setIsScriptLoading(true);
    setScriptError(null);

    try {
      const plan = await requestLessonScript(
        currentChunk.items,
        targetDuration,
        currentChunk.suggestedTitle,
        currentChunk.lessonIndex,
        lessonChunks.length
      );
      setLessonPlan(plan);
      if (onSaveScriptToLesson) {
        onSaveScriptToLesson(plan);
      }
    } catch (err: any) {
      setScriptError(err.message || 'Lỗi khi tạo kịch bản với Gemini.');
    } finally {
      setIsScriptLoading(false);
    }
  };

  // Tự động tạo kịch bản nếu chưa có
  useEffect(() => {
    if (!lessonPlan && items.length > 0 && !isScriptLoading) {
      handleGenerateScript();
    }
  }, [selectedChunkIndex, targetDuration]);

  // Chỉnh sửa scene
  const startEditScene = (scene: LessonScene) => {
    setEditingSceneId(scene.sceneId);
    setEditingSceneData({ ...scene });
  };

  const cancelEditScene = () => {
    setEditingSceneId(null);
    setEditingSceneData({});
  };

  const saveEditScene = () => {
    if (!editingSceneId || !lessonPlan) return;
    const updatedScenes = lessonPlan.scenes.map((s) => {
      if (s.sceneId === editingSceneId) {
        return {
          ...s,
          ...editingSceneData,
        } as LessonScene;
      }
      return s;
    });

    const updatedPlan: GeneratedLessonPlan = {
      ...lessonPlan,
      scenes: updatedScenes,
    };
    setLessonPlan(updatedPlan);
    if (onSaveScriptToLesson) {
      onSaveScriptToLesson(updatedPlan);
    }
    setEditingSceneId(null);
    setEditingSceneData({});
  };

  // Tải kịch bản dạng Text file
  const downloadScriptFile = () => {
    if (!lessonPlan) return;
    let text = `========================================================\n`;
    text += `KỊCH BẢN BÀI GIẢNG TIẾNG TRUNG (8 SCENES SƯ PHẠM)\n`;
    text += `Tiêu đề: ${lessonPlan.title}\n`;
    text += `Chủ đề: ${lessonPlan.topic}\n`;
    text += `Thời lượng dự kiến: ${lessonPlan.targetDurationMinutes} phút (~${lessonPlan.actualEstimatedDurationSeconds}s)\n`;
    text += `Bài số: ${lessonPlan.lessonIndex} / ${lessonPlan.totalLessons}\n`;
    text += `========================================================\n\n`;

    text += `NHÂN VẬT THAM GIA:\n`;
    lessonPlan.characters.forEach((c) => {
      text += `- ${c.name} (${c.role}): ${c.description}\n`;
    });
    text += `\n--------------------------------------------------------\n`;

    lessonPlan.scenes.forEach((s) => {
      const meta = SCENE_TYPE_TITLES[s.type];
      text += `\n[${meta.title}] - Thời lượng: ${s.duration}s\n`;
      text += `Nhân vật: ${s.characters.join(', ')} | Giọng: ${s.voice}\n`;
      text += `Chữ Hán: ${s.chineseText}\n`;
      text += `Pinyin: ${s.pinyin}\n`;
      text += `Dịch nghĩa: ${s.vietnamese}\n`;
      text += `Lời giảng giáo viên (Tiếng Việt):\n"${s.teacherExplanation}"\n`;
      text += `Từ khóa highlight: ${s.highlightWords.join(', ')}\n`;
      text += `Visual Prompt: ${s.visualPrompt}\n`;
      text += `--------------------------------------------------------\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kich_ban_${lessonPlan.lessonId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentChunk = lessonChunks[selectedChunkIndex] || lessonChunks[0];
  const wordsPerLesson = getRecommendedWordsPerLesson(targetDuration);

  return (
    <div className="space-y-6">
      {/* Header Banner & Duration Settings */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-rose-600">LESSON GENERATOR</span>
              <span>·</span>
              <span>8 SCENES SƯ PHẠM</span>
              <span>·</span>
              <span>PHONG CÁCH GIẢNG BẢN XỨ THÂN THIỆN</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {lessonPlan?.title || currentChunk?.suggestedTitle || 'Kịch bản bài giảng tiếng Trung'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Gemini tự động viết kịch bản như một giáo viên trực tiếp giảng dạy: mở đầu bằng tình huống hội thoại thực tế, phân tích cấu trúc, lưu ý lỗi người Việt hay mắc và luyện nghe phản xạ.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGenerateScript}
              disabled={isScriptLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isScriptLoading ? 'animate-spin' : ''}`} />
              <span>{isScriptLoading ? 'Đang viết kịch bản...' : 'AI viết lại kịch bản'}</span>
            </button>

            {lessonPlan && (
              <button
                onClick={downloadScriptFile}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
                title="Tải kịch bản đầy đủ"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải kịch bản</span>
              </button>
            )}

            <button
              onClick={onGoToVideoConfig}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Chuyển sang cấu hình Video →</span>
            </button>
          </div>
        </div>

        {/* Duration Selector & Multi-lesson chunking */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Target Duration Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời lượng bài giảng mong muốn:</span>
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">
              {([3, 5, 10, 15] as LessonDurationTarget[]).map((dur) => (
                <button
                  key={dur}
                  onClick={() => setTargetDuration(dur)}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    targetDuration === dur
                      ? 'bg-white text-rose-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dur} phút {dur === 5 && '(Chuẩn)'}
                </button>
              ))}
            </div>
          </div>

          {/* Info on segmentation */}
          <div className="text-slate-500 text-xs">
            Tổng cộng <strong className="text-slate-800 font-mono tabular-nums">{items.length}</strong> từ vựng → Tự động chia thành{' '}
            <strong className="text-rose-600 font-mono tabular-nums">{lessonChunks.length}</strong> video bài giảng (~{wordsPerLesson} từ/video)
          </div>
        </div>

        {/* Multi-lesson Tabs if more than 1 chunk */}
        {lessonChunks.length > 1 && (
          <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Chọn bài giảng:
            </span>
            {lessonChunks.map((chunk, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedChunkIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  selectedChunkIndex === idx
                    ? 'bg-rose-50 text-rose-950 border border-rose-200 font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <span>Bài {chunk.lessonIndex}</span>
                <span className="ml-1 text-[11px] text-slate-400 font-mono">
                  ({chunk.items.length} từ)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {scriptError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {scriptError}
        </div>
      )}

      {/* Target vocabulary list for this lesson */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Từ vựng trọng tâm trong video này:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentChunk?.items.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
            >
              <span className="font-bold text-slate-900">{item.chinese}</span>
              <span className="font-mono text-rose-600 text-[11px]">{item.pinyin}</span>
              <span className="text-slate-500">· {item.vietnamese}</span>
              <button
                onClick={() => speakChinese(item.chinese)}
                title="Nghe phát âm"
                className="text-slate-400 hover:text-rose-600 ml-0.5"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Characters in Lesson */}
      {lessonPlan && lessonPlan.characters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Dàn nhân vật & Giọng đọc tham gia bài học
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {lessonPlan.characters.map((char, cIdx) => (
              <div key={cIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{char.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{char.role}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">{char.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 SCENES SCRIPT ACCORDION LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-rose-600" />
            <span>Kịch bản chi tiết 8 Scenes</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Tổng thời lượng: ~{lessonPlan?.actualEstimatedDurationSeconds || 300} giây
          </span>
        </div>

        {lessonPlan?.scenes.map((scene) => {
          const isExpanded = expandedSceneId === scene.sceneId || editingSceneId === scene.sceneId;
          const isEditing = editingSceneId === scene.sceneId;
          const meta = SCENE_TYPE_TITLES[scene.type] || {
            title: `SCENE ${scene.sceneId}`,
            desc: '',
          };

          return (
            <div
              key={scene.sceneId}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                isEditing
                  ? 'border-rose-300 ring-2 ring-rose-500/10 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Scene Header */}
              <div
                onClick={() => {
                  if (!isEditing) {
                    setExpandedSceneId(isExpanded ? null : scene.sceneId);
                  }
                }}
                className="p-4 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    0{scene.sceneId}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono uppercase">
                        {meta.title}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        ({scene.duration}s)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{meta.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 hidden md:inline font-mono">
                    {scene.characters.join(' · ')}
                  </span>

                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditScene(scene);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                      title="Chỉnh sửa scene này"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Scene Expanded Body */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 text-xs animate-in fade-in duration-150">
                  {/* EDIT MODE */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Thời lượng (giây):
                          </label>
                          <input
                            type="number"
                            value={editingSceneData.duration || 10}
                            onChange={(e) =>
                              setEditingSceneData({
                                ...editingSceneData,
                                duration: parseInt(e.target.value) || 10,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Nhân vật tham gia (phân cách bằng dấu phẩy):
                          </label>
                          <input
                            type="text"
                            value={editingSceneData.characters?.join(', ') || ''}
                            onChange={(e) =>
                              setEditingSceneData({
                                ...editingSceneData,
                                characters: e.target.value.split(',').map((c) => c.trim()),
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Lời giảng của giáo viên bằng tiếng Việt:
                        </label>
                        <textarea
                          rows={3}
                          value={editingSceneData.teacherExplanation || ''}
                          onChange={(e) =>
                            setEditingSceneData({
                              ...editingSceneData,
                              teacherExplanation: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="font-semibold text-slate-700 block">
                          Nội dung tiếng Trung & Dịch:
                        </label>
                        <textarea
                          rows={2}
                          value={editingSceneData.chineseText || ''}
                          placeholder="Chữ Hán"
                          onChange={(e) =>
                            setEditingSceneData({
                              ...editingSceneData,
                              chineseText: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={editingSceneData.pinyin || ''}
                          placeholder="Pinyin"
                          onChange={(e) =>
                            setEditingSceneData({
                              ...editingSceneData,
                              pinyin: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-rose-700"
                        />
                        <input
                          type="text"
                          value={editingSceneData.vietnamese || ''}
                          placeholder="Bản dịch tiếng Việt"
                          onChange={(e) =>
                            setEditingSceneData({
                              ...editingSceneData,
                              vietnamese: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs italic"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={cancelEditScene}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={saveEditScene}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                        >
                          Lưu Scene
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="space-y-3">
                      {/* Teacher Explanation Box */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                          <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                          <span>Lời giảng của giáo viên (Tiếng Việt):</span>
                        </div>
                        <p className="text-amber-900 leading-relaxed text-xs">
                          "{scene.teacherExplanation}"
                        </p>
                      </div>

                      {/* Chinese text presentation */}
                      {scene.chineseText && (
                        <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Nội dung hiển thị trên video:
                            </span>
                            <button
                              onClick={() => speakChinese(scene.chineseText)}
                              className="text-slate-400 hover:text-rose-600 flex items-center gap-1 text-[11px]"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Phát âm câu</span>
                            </button>
                          </div>

                          <div className="text-sm sm:text-base font-bold text-slate-900 whitespace-pre-line font-sans">
                            {scene.chineseText}
                          </div>
                          {scene.pinyin && (
                            <div className="text-xs font-mono text-rose-700 whitespace-pre-line">
                              {scene.pinyin}
                            </div>
                          )}
                          {scene.vietnamese && (
                            <div className="text-xs text-slate-600 italic whitespace-pre-line">
                              {scene.vietnamese}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Highlight words & Visual prompt */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] text-slate-600">
                        <div>
                          <strong className="text-slate-700 block mb-0.5">Từ khóa highlight:</strong>
                          <div className="flex flex-wrap gap-1">
                            {scene.highlightWords.map((hw, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-rose-700"
                              >
                                {hw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <strong className="text-slate-700 block mb-0.5">Visual Prompt (Khung hình):</strong>
                          <p className="text-slate-500 italic leading-normal">
                            {scene.visualPrompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
