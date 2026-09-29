import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles, 
  Upload, 
  EyeOff, 
  CheckCircle2, 
  RefreshCw, 
  Film, 
  Sliders, 
  Info, 
  Layers, 
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Code2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LessonScene } from '../../types/lesson';
import { 
  SceneVisualMetadata, 
  VisualAssetType, 
  VisualMode, 
  VisualStyle,
  VisualGenerationRequest 
} from '../../types/visual';
import { visualEngine } from '../../services/visualEngine/visualEngineService';
import { buildSmartVisualPrompt } from '../../services/visualEngine/promptBuilder';

interface VisualGeneratorPanelProps {
  scenes: LessonScene[];
  currentSceneIndex: number;
  onSelectScene?: (index: number) => void;
  onVisualUpdated?: (sceneId: string, metadata: SceneVisualMetadata) => void;
}

export const VisualGeneratorPanel: React.FC<VisualGeneratorPanelProps> = ({
  scenes,
  currentSceneIndex,
  onSelectScene,
  onVisualUpdated,
}) => {
  const [visuals, setVisuals] = useState<Map<string, SceneVisualMetadata>>(new Map());
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('warm_educational_animation');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingSceneId, setGeneratingSceneId] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [editingPromptSceneId, setEditingPromptSceneId] = useState<number | null>(null);
  const [customPrompts, setCustomPrompts] = useState<Record<number, string>>({});
  const [showMetadataJson, setShowMetadataJson] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetSceneId, setUploadTargetSceneId] = useState<number | null>(null);
  const [uploadTargetType, setUploadTargetType] = useState<VisualAssetType>('image');

  useEffect(() => {
    setVisuals(new Map(visualEngine.getAllVisuals()));
  }, []);

  const getScenePrompt = (scene: LessonScene): string => {
    if (customPrompts[scene.sceneId]) {
      return customPrompts[scene.sceneId];
    }
    const meta = visuals.get(String(scene.sceneId));
    if (meta && meta.visualPrompt) {
      return meta.visualPrompt;
    }
    return buildSmartVisualPrompt(scene, selectedStyle, aspectRatio);
  };

  // Tạo Visual AI (Image hoặc Video) cho 1 Scene
  const handleGenerateSingle = async (scene: LessonScene, assetType: VisualAssetType) => {
    setGeneratingSceneId(scene.sceneId);
    const prompt = getScenePrompt(scene);

    const req: VisualGenerationRequest = {
      sceneId: String(scene.sceneId),
      sceneType: scene.type,
      visualPrompt: prompt,
      assetType,
      duration: scene.duration || 15,
      aspectRatio,
      style: selectedStyle,
      topic: scene.teacherExplanation,
      highlightWords: scene.highlightWords,
    };

    try {
      const meta = await visualEngine.generateSceneVisual(req);
      setVisuals(new Map(visualEngine.getAllVisuals()));
      if (onVisualUpdated) {
        onVisualUpdated(String(scene.sceneId), meta);
      }
    } catch (err) {
      console.error('Lỗi khi tạo visual:', err);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  // Đổi sang No Visual
  const handleSetNoVisual = (scene: LessonScene) => {
    const meta = visualEngine.setNoVisual(scene.sceneId, scene.duration);
    setVisuals(new Map(visualEngine.getAllVisuals()));
    if (onVisualUpdated) {
      onVisualUpdated(String(scene.sceneId), meta);
    }
  };

  // Kích hoạt dialog tải file
  const handleTriggerUpload = (scene: LessonScene, assetType: VisualAssetType) => {
    setUploadTargetSceneId(scene.sceneId);
    setUploadTargetType(assetType);
    if (fileInputRef.current) {
      fileInputRef.current.accept = assetType === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadTargetSceneId === null) return;

    const scene = scenes.find(s => s.sceneId === uploadTargetSceneId);
    const duration = scene ? scene.duration : 15;

    const meta = await visualEngine.setUserUploadedFile(
      uploadTargetSceneId,
      file,
      uploadTargetType,
      duration
    );

    setVisuals(new Map(visualEngine.getAllVisuals()));
    if (onVisualUpdated) {
      onVisualUpdated(String(uploadTargetSceneId), meta);
    }

    // Reset input
    e.target.value = '';
    setUploadTargetSceneId(null);
  };

  // Tạo visual cho toàn bộ 8 scenes
  const handleGenerateAll = async (assetType: VisualAssetType = 'image') => {
    if (scenes.length === 0) return;
    setIsGeneratingAll(true);
    setProgress({ completed: 0, total: scenes.length });

    try {
      await visualEngine.generateAllScenesVisual(
        scenes,
        selectedStyle,
        assetType,
        aspectRatio,
        (completed, total) => {
          setProgress({ completed, total });
        }
      );
      setVisuals(new Map(visualEngine.getAllVisuals()));
    } catch (err) {
      console.error('Lỗi khi tạo visual toàn bộ:', err);
    } finally {
      setIsGeneratingAll(false);
      setProgress(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6">
      
      {/* Hidden File Input for Image/Video Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. Header & Quick Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-1">
            <Film className="w-3.5 h-3.5" />
            <span className="tracking-wider uppercase">VISUAL GENERATOR · B-ROLL & MINH HỌA</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Tạo hình ảnh & Video minh họa theo Scene</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Zero Text Injection
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            AI chỉ tạo background, nhân vật, bối cảnh lớp học & B-roll. Toàn bộ chữ Hán, Pinyin và tiếng Việt luôn do Renderer hiển thị.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateAll('image')}
            disabled={isGeneratingAll || scenes.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tạo AI Image cả 8 Scenes</span>
          </button>

          <button
            onClick={() => handleGenerateAll('video')}
            disabled={isGeneratingAll || scenes.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <VideoIcon className="w-3.5 h-3.5" />
            <span>Tạo Veo Video (16:9)</span>
          </button>
        </div>
      </div>

      {/* Progress banner if generating all */}
      {isGeneratingAll && progress && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
            <span>Đang tạo hình ảnh & video minh họa ({progress.completed} / {progress.total} scenes)...</span>
          </div>
          <span className="font-mono font-bold">{Math.round((progress.completed / progress.total) * 100)}%</span>
        </div>
      )}

      {/* 2. Visual Style & Ratio Settings */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Style selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-rose-600" />
            <span>Phong cách hình ảnh (Visual Style):</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedStyle('warm_educational_animation')}
              className={`p-2 rounded-lg border text-left transition-all ${
                selectedStyle === 'warm_educational_animation'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold">Hoạt họa ấm áp</div>
              <div className="text-[10px] text-slate-500">Ghibli / Shinkai anime</div>
            </button>

            <button
              onClick={() => setSelectedStyle('clean_chinese_classroom')}
              className={`p-2 rounded-lg border text-left transition-all ${
                selectedStyle === 'clean_chinese_classroom'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold">Lớp học hiện đại</div>
              <div className="text-[10px] text-slate-500">Ánh sáng tự nhiên, bàn gỗ</div>
            </button>

            <button
              onClick={() => setSelectedStyle('cinematic_broll')}
              className={`p-2 rounded-lg border text-left transition-all ${
                selectedStyle === 'cinematic_broll'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold">Cinematic B-roll</div>
              <div className="text-[10px] text-slate-500">Góc quay điện ảnh 35mm</div>
            </button>

            <button
              onClick={() => setSelectedStyle('cozy_campus_lifestyle')}
              className={`p-2 rounded-lg border text-left transition-all ${
                selectedStyle === 'cozy_campus_lifestyle'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold">Khuôn viên đại học</div>
              <div className="text-[10px] text-slate-500">Quán cafe, thư viện ấm cúng</div>
            </button>
          </div>
        </div>

        {/* Aspect Ratio & Rule reminder */}
        <div className="space-y-2.5">
          <div>
            <label className="font-bold text-slate-700 mb-1.5 block">
              Tỷ lệ khung hình (Aspect Ratio):
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 py-2 px-3 rounded-lg border text-center font-mono text-xs transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-white text-slate-900 border-slate-900 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                16:9 (YouTube - Khuyên dùng cho Veo)
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 py-2 px-3 rounded-lg border text-center font-mono text-xs transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-white text-rose-700 border-rose-600 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                9:16 (Shorts / Reels)
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold flex items-center gap-1 mb-0.5">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>Quy tắc Visual:</span>
            </span>
            <span>
              Visual Generator không render bất kỳ chữ Hán hay Pinyin nào trên file ảnh/video để tránh lỗi chính tả. Văn bản bài học luôn được renderer hiển thị chuẩn xác từng nét đè lên trên.
            </span>
          </div>
        </div>

      </div>

      {/* 3. Scene List with Visual Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>CẤU HÌNH VISUAL CHO TỪNG SCENE (8 SCENES)</span>
          <span>
            Đã có visual: <strong>{Array.from(visuals.values()).filter(v => v.visualMode !== 'no_visual').length} / {scenes.length}</strong>
          </span>
        </div>

        <div className="space-y-3.5">
          {scenes.map((scene, idx) => {
            const sceneIdStr = String(scene.sceneId);
            const meta = visuals.get(sceneIdStr);
            const mode: VisualMode = meta?.visualMode || 'ai_image';
            const isGenerating = generatingSceneId === scene.sceneId;
            const prompt = getScenePrompt(scene);
            const isEditingPrompt = editingPromptSceneId === scene.sceneId;
            const isSelected = currentSceneIndex === idx;

            return (
              <div
                key={scene.sceneId}
                className={`border rounded-xl p-4 transition-all ${
                  isSelected ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left: Scene Info & Mode Selector */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">
                        {scene.sceneId}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        SCENE {scene.sceneId}: {scene.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({scene.duration}s)
                      </span>
                    </div>

                    {/* Mode Selector Tabs (5 Chế độ theo đúng yêu cầu) */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs w-fit">
                      <button
                        onClick={() => handleSetNoVisual(scene)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          mode === 'no_visual' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <EyeOff className="w-3 h-3" />
                        <span>No visual</span>
                      </button>

                      <button
                        onClick={() => handleGenerateSingle(scene, 'image')}
                        disabled={isGenerating}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          mode === 'ai_image' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-rose-600" />
                        <span>AI image</span>
                      </button>

                      <button
                        onClick={() => handleGenerateSingle(scene, 'video')}
                        disabled={isGenerating}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          mode === 'ai_video' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Film className="w-3 h-3 text-rose-600" />
                        <span>AI video (Veo)</span>
                      </button>

                      <button
                        onClick={() => handleTriggerUpload(scene, 'image')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          mode === 'upload_image' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload image</span>
                      </button>

                      <button
                        onClick={() => handleTriggerUpload(scene, 'video')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          mode === 'upload_video' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <VideoIcon className="w-3 h-3" />
                        <span>Upload video</span>
                      </button>
                    </div>

                    {/* Visual Prompt Section */}
                    {mode !== 'no_visual' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Mô tả bối cảnh (Visual Prompt):</span>
                          <button
                            onClick={() => setEditingPromptSceneId(isEditingPrompt ? null : scene.sceneId)}
                            className="text-rose-600 hover:underline font-medium"
                          >
                            {isEditingPrompt ? 'Đóng chỉnh sửa' : 'Tùy chỉnh Prompt'}
                          </button>
                        </div>

                        {isEditingPrompt ? (
                          <div className="space-y-1.5">
                            <textarea
                              value={prompt}
                              onChange={(e) => setCustomPrompts({ ...customPrompts, [scene.sceneId]: e.target.value })}
                              rows={2}
                              className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:outline-rose-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  const reset = buildSmartVisualPrompt(scene, selectedStyle, aspectRatio);
                                  setCustomPrompts({ ...customPrompts, [scene.sceneId]: reset });
                                }}
                                className="text-[11px] text-slate-500 hover:text-slate-800"
                              >
                                Đặt lại mặc định
                              </button>
                              <button
                                onClick={() => handleGenerateSingle(scene, meta?.assetType || 'image')}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold"
                              >
                                Tạo lại với Prompt này
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2 rounded-lg line-clamp-2 border border-slate-100">
                            {prompt}
                          </p>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Right: Visual Asset Preview & Metadata Inspector */}
                  <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                    <div className="relative w-44 sm:w-52 aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-2xs group">
                      {isGenerating ? (
                        <div className="flex flex-col items-center gap-1.5 text-xs text-slate-500">
                          <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
                          <span>Đang tạo visual...</span>
                        </div>
                      ) : mode === 'no_visual' ? (
                        <div className="flex flex-col items-center gap-1 text-slate-400 text-xs">
                          <EyeOff className="w-5 h-5" />
                          <span>No visual</span>
                        </div>
                      ) : meta?.url ? (
                        meta.assetType === 'video' ? (
                          <video
                            src={meta.url}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={meta.url}
                            alt="Scene visual"
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400 text-xs p-2 text-center">
                          <ImageIcon className="w-5 h-5" />
                          <span>Chưa có visual</span>
                        </div>
                      )}

                      {/* Badge Asset Type */}
                      {meta?.url && mode !== 'no_visual' && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white font-semibold">
                          {meta.assetType.toUpperCase()} ({scene.duration}s)
                        </span>
                      )}
                    </div>

                    {/* Metadata JSON Toggle */}
                    <button
                      onClick={() => setShowMetadataJson(showMetadataJson === sceneIdStr ? null : sceneIdStr)}
                      className="text-[11px] font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{showMetadataJson === sceneIdStr ? 'Ẩn Metadata' : 'Xem JSON Metadata'}</span>
                    </button>
                  </div>

                </div>

                {/* Metadata JSON Viewer */}
                {showMetadataJson === sceneIdStr && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(
                        {
                          sceneId: String(scene.sceneId),
                          visualPrompt: prompt,
                          assetType: meta?.assetType || 'image',
                          duration: scene.duration || 15,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
