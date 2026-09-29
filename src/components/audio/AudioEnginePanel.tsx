import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Mic2, 
  Play, 
  Pause, 
  Sparkles, 
  Download, 
  Sliders, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Radio, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Headphones,
  Settings2
} from 'lucide-react';
import { LessonScene } from '../../types/lesson';
import { 
  AudioMetadata, 
  AudioSegment, 
  TTSSpeedMode, 
  TTSProviderId 
} from '../../services/audioEngine/types';
import { audioEngine } from '../../services/audioEngine/audioEngineService';
import { AVAILABLE_VOICES } from '../../services/audioEngine/voicePresets';

interface AudioEnginePanelProps {
  scenes: LessonScene[];
  currentSceneIndex: number;
  onSelectScene?: (index: number) => void;
  onAudioGenerated?: (sceneId: string, metadata: AudioMetadata) => void;
}

export const AudioEnginePanel: React.FC<AudioEnginePanelProps> = ({
  scenes,
  currentSceneIndex,
  onSelectScene,
  onAudioGenerated,
}) => {
  const [settings, setSettings] = useState(audioEngine.getSettings());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingSceneId, setGeneratingSceneId] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ completed: number; total: number } | null>(null);

  const [audios, setAudios] = useState<Map<string, AudioMetadata>>(new Map());
  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<number>(0);
  const [activeSegment, setActiveSegment] = useState<AudioSegment | null>(null);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Sync state from audioEngine
  useEffect(() => {
    setAudios(new Map(audioEngine.getAllAudios()));
  }, []);

  const handleSettingChange = (patch: Partial<typeof settings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    audioEngine.updateSettings(patch);
  };

  // Tạo âm thanh cho 1 Scene
  const handleGenerateSingle = async (scene: LessonScene) => {
    setGeneratingSceneId(scene.sceneId);
    try {
      const meta = await audioEngine.generateSceneAudio(scene);
      setAudios(new Map(audioEngine.getAllAudios()));
      if (onAudioGenerated) {
        onAudioGenerated(String(scene.sceneId), meta);
      }
    } catch (err) {
      console.error('Lỗi khi tạo audio cho scene:', err);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  // Tạo âm thanh cho toàn bộ 8 scenes
  const handleGenerateAll = async () => {
    if (scenes.length === 0) return;
    setIsGeneratingAll(true);
    setGenerationProgress({ completed: 0, total: scenes.length });

    try {
      await audioEngine.generateAllScenesAudio(scenes, (completed, total) => {
        setGenerationProgress({ completed, total });
      });
      setAudios(new Map(audioEngine.getAllAudios()));
    } catch (err) {
      console.error('Lỗi khi tạo audio toàn bộ:', err);
    } finally {
      setIsGeneratingAll(false);
      setGenerationProgress(null);
    }
  };

  // Phát / Tạm dừng audio
  const handleTogglePlay = (scene: LessonScene) => {
    const sceneId = String(scene.sceneId);

    if (playingSceneId === sceneId) {
      audioEngine.stopAudio();
      setPlayingSceneId(null);
      setActiveSegment(null);
    } else {
      setPlayingSceneId(sceneId);
      audioEngine.playSceneAudio(
        scene,
        (time, seg) => {
          setCurrentPlaybackTime(time);
          setActiveSegment(seg);
        },
        () => {
          setPlayingSceneId(null);
          setActiveSegment(null);
          setCurrentPlaybackTime(0);
        }
      );
    }
  };

  const handleDownloadWav = (meta: AudioMetadata, sceneTitle: string) => {
    if (!meta.audioUrl) return;
    const a = document.createElement('a');
    a.href = meta.audioUrl;
    a.download = `Scene_${meta.sceneId}_${sceneTitle.replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const chineseTeacherVoices = AVAILABLE_VOICES.filter(v => v.role === 'chinese_teacher');
  const vietnameseTeacherVoices = AVAILABLE_VOICES.filter(v => v.role === 'vietnamese_teacher');
  const characterAVoices = AVAILABLE_VOICES.filter(v => v.role === 'character_a');
  const characterBVoices = AVAILABLE_VOICES.filter(v => v.role === 'character_b');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6">
      
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="tracking-wider uppercase">AUDIO / TTS ENGINE CHUYÊN NGHIỆP</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Studio tạo giọng đọc & Âm thanh bài giảng</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Gemini 3.8 Flash Lite TTS Ready
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Phát âm Mandarin chuẩn Bắc Kinh, giáo viên giải thích tiếng Việt tự nhiên, timing từng từ đồng bộ với Video Renderer
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Cấu hình giọng đọc</span>
            {isSettingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleGenerateAll}
            disabled={isGeneratingAll || scenes.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingAll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tạo ({generationProgress?.completed}/{generationProgress?.total})...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo audio cho toàn bộ {scenes.length} Scenes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Collapsible Settings Drawer */}
      {isSettingsOpen && (
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-5 animate-in fade-in duration-200">
          
          {/* Row 1: TTS Provider & Speed Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Provider Selector (Abstraction Layer) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-rose-600" />
                <span>Nhà cung cấp giọng đọc (TTS Provider):</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSettingChange({ provider: 'gemini_tts' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    settings.provider === 'gemini_tts'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1 text-[12px]">
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>Gemini 3.8 TTS</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Studio Audio WAV, 24kHz âm sắc đa dạng
                  </div>
                </button>

                <button
                  onClick={() => handleSettingChange({ provider: 'web_speech' })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    settings.provider === 'web_speech'
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1 text-[12px]">
                    <Volume2 className="w-3 h-3 text-rose-600" />
                    <span>Web Speech API</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Trình duyệt gốc (zh-CN & vi-VN tức thì)
                  </div>
                </button>
              </div>
            </div>

            {/* Speed Mode: Normal, Slow, Very Slow */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Tốc độ đọc (Speed Mode):</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  onClick={() => handleSettingChange({ speedMode: 'normal' })}
                  className={`py-2 px-2 rounded-lg border text-center font-medium transition-all ${
                    settings.speedMode === 'normal'
                      ? 'bg-white text-slate-900 border-slate-900 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>Bình thường</div>
                  <div className="text-[10px] text-slate-400">1.0x bản xứ</div>
                </button>

                <button
                  onClick={() => handleSettingChange({ speedMode: 'slow' })}
                  className={`py-2 px-2 rounded-lg border text-center font-medium transition-all ${
                    settings.speedMode === 'slow'
                      ? 'bg-white text-rose-700 border-rose-600 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>Chậm</div>
                  <div className="text-[10px] text-slate-400">0.8x người mới</div>
                </button>

                <button
                  onClick={() => handleSettingChange({ speedMode: 'very_slow' })}
                  className={`py-2 px-2 rounded-lg border text-center font-medium transition-all ${
                    settings.speedMode === 'very_slow'
                      ? 'bg-white text-rose-700 border-rose-600 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>Rất chậm</div>
                  <div className="text-[10px] text-slate-400">0.65x rõ thanh điệu</div>
                </button>
              </div>
            </div>

          </div>

          {/* Row 2: 4 Voice Role Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
            
            {/* 1. Chinese Teacher Voice */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>🇨🇳 Giáo viên tiếng Trung:</span>
              </label>
              <select
                value={settings.chineseTeacherVoice}
                onChange={(e) => handleSettingChange({ chineseTeacherVoice: e.target.value })}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-rose-500"
              >
                {chineseTeacherVoices.map(v => (
                  <option key={v.id} value={v.geminiVoiceName}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Vietnamese Teacher Voice */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>🇻🇳 Giáo viên tiếng Việt:</span>
              </label>
              <select
                value={settings.vietnameseTeacherVoice}
                onChange={(e) => handleSettingChange({ vietnameseTeacherVoice: e.target.value })}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-rose-500"
              >
                {vietnameseTeacherVoices.map(v => (
                  <option key={v.id} value={v.geminiVoiceName}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Character A Voice */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>👩 Nhân vật A (Hội thoại):</span>
              </label>
              <select
                value={settings.characterAVoice}
                onChange={(e) => handleSettingChange({ characterAVoice: e.target.value })}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-rose-500"
              >
                {characterAVoices.map(v => (
                  <option key={v.id} value={v.geminiVoiceName}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* 4. Character B Voice */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>👨 Nhân vật B (Hội thoại):</span>
              </label>
              <select
                value={settings.characterBVoice}
                onChange={(e) => handleSettingChange({ characterBVoice: e.target.value })}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-rose-500"
              >
                {characterBVoices.map(v => (
                  <option key={v.id} value={v.geminiVoiceName}>{v.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Row 3: Pinyin & Natural Pause Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 text-xs">
            
            {/* Quy tắc phát âm Pinyin */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <div>
                <div className="font-semibold text-slate-900">
                  Phát âm chữ Hán trong hội thoại:
                </div>
                <div className="text-[11px] text-slate-500">
                  {settings.includePinyinAudio
                    ? 'Đang bật đọc cả phiên âm Pinyin (chế độ luyện Pinyin)'
                    : 'Pinyin chỉ để hiển thị, chỉ phát âm chữ Hán chuẩn Mandarin'}
                </div>
              </div>

              <button
                onClick={() => handleSettingChange({ includePinyinAudio: !settings.includePinyinAudio })}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  settings.includePinyinAudio
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {settings.includePinyinAudio ? 'Đọc Pinyin' : 'Chỉ đọc chữ Hán'}
              </button>
            </div>

            {/* Khoảng nghỉ giữa các câu (Natural Pause) */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">Khoảng nghỉ tự nhiên giữa các câu:</span>
                <span className="font-mono font-bold text-rose-600">
                  {(settings.pauseBetweenSentencesMs / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="2000"
                step="100"
                value={settings.pauseBetweenSentencesMs}
                onChange={(e) => handleSettingChange({ pauseBetweenSentencesMs: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.2s (Nhanh)</span>
                <span>0.6s (Khuyên dùng)</span>
                <span>2.0s (Luyện đọc theo)</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 3. Live Active Playback Indicator (Karaoke Highlight sync) */}
      {playingSceneId && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <div>
              <span className="font-bold text-rose-950 mr-2">
                Đang phát Scene {playingSceneId}:
              </span>
              <span className="text-slate-600 font-mono">
                {currentPlaybackTime.toFixed(1)}s
              </span>
              {activeSegment && (
                <span className="ml-3 px-2 py-0.5 rounded bg-rose-200/80 font-bold text-rose-900">
                  "{activeSegment.text}"
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.stopAudio();
              setPlayingSceneId(null);
            }}
            className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700"
          >
            Dừng phát
          </button>
        </div>
      )}

      {/* 4. Scene Audio List & Segments Explorer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>DANH SÁCH 8 SCENES VÀ DỮ LIỆU METADATA TIMING</span>
          <span>
            Đã sẵn sàng: <strong>{audios.size} / {scenes.length}</strong> scenes
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {scenes.map((scene, idx) => {
            const sceneIdStr = String(scene.sceneId);
            const meta = audios.get(sceneIdStr);
            const isPlaying = playingSceneId === sceneIdStr;
            const isGenerating = generatingSceneId === scene.sceneId;
            const isExpanded = expandedSceneId === sceneIdStr;
            const isSelected = currentSceneIndex === idx;

            return (
              <div 
                key={scene.sceneId} 
                className={`p-3.5 transition-colors ${
                  isSelected ? 'bg-rose-50/30' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      meta ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {scene.sceneId}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          SCENE {scene.sceneId}: {scene.type.toUpperCase()}
                        </span>
                        {meta ? (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{meta.duration}s</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Chưa tạo audio
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {scene.chineseText ? (
                          <span className="font-medium text-slate-700">{scene.chineseText}</span>
                        ) : (
                          <span>{scene.teacherExplanation}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Play / Stop Button */}
                    <button
                      onClick={() => handleTogglePlay(scene)}
                      className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                        isPlaying
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : meta
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={isPlaying ? 'Dừng phát' : 'Nghe thử audio'}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Dừng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Phát thử</span>
                        </>
                      )}
                    </button>

                    {/* Generate single */}
                    <button
                      onClick={() => handleGenerateSingle(scene)}
                      disabled={isGenerating}
                      className="p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
                      title="Tạo lại audio cho riêng Scene này"
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span className="hidden sm:inline">Tạo audio</span>
                    </button>

                    {/* View Segments Timing Accordion */}
                    {meta && (
                      <button
                        onClick={() => setExpandedSceneId(isExpanded ? null : sceneIdStr)}
                        className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
                          isExpanded ? 'bg-slate-100 border-slate-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title="Xem bảng chi tiết các segment timing"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Download WAV */}
                    {meta && meta.audioUrl && (
                      <button
                        onClick={() => handleDownloadWav(meta, scene.type)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs"
                        title="Tải file âm thanh WAV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Expanded Segments Timing Table */}
                {isExpanded && meta && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Chi tiết các Segments ({meta.segments.length} phân đoạn timing):</span>
                      <span className="font-mono text-slate-400">Giọng đọc: {meta.voice}</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                      {meta.segments.map((seg, sIdx) => {
                        const isCurrentSeg = activeSegment?.text === seg.text && playingSceneId === sceneIdStr;
                        return (
                          <div 
                            key={sIdx}
                            className={`p-2 flex items-center justify-between font-mono text-[11px] ${
                              isCurrentSeg ? 'bg-rose-50 font-bold text-rose-900' : 'text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px]">#{sIdx + 1}</span>
                              <span className="font-sans font-medium text-slate-900 text-xs">{seg.text}</span>
                              {seg.speaker && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 text-[10px]">
                                  {seg.speaker}
                                </span>
                              )}
                            </div>

                            <div className="tabular-nums text-slate-500">
                              <span>{seg.start}s</span>
                              <span className="mx-1">→</span>
                              <span>{seg.end}s</span>
                              <span className="text-[10px] text-slate-400 ml-1">
                                ({(seg.end - seg.start).toFixed(2)}s)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
