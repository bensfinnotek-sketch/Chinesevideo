import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Layers,
  UserCheck,
  CheckCircle2,
  Highlighter,
  Sliders,
  Tv,
  Headphones,
  Radio,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { 
  LessonContent, 
  LessonScene, 
  VideoConfig, 
  SCENE_TYPE_TITLES 
} from '../../types/lesson';
import { parseDialogueTurns, DialogueTurn } from '../../services/dialogueParser';
import { DialogueTurnRenderer } from './DialogueTurnRenderer';
import { speakChinese, stopSpeaking } from '../../services/audioSynthesis';
import { audioEngine } from '../../services/audioEngine/audioEngineService';
import { AudioEnginePanel } from '../audio/AudioEnginePanel';
import { AudioSegment } from '../../services/audioEngine/types';
import { visualEngine } from '../../services/visualEngine/visualEngineService';
import { VisualGeneratorPanel } from '../visual/VisualGeneratorPanel';
import { SceneVisualMetadata } from '../../types/visual';

interface VideoPreviewProps {
  lesson: LessonContent;
  config: VideoConfig;
  onOpenConfig?: () => void;
  onOpenExport?: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  lesson,
  config,
  onOpenConfig,
  onOpenExport,
}) => {
  // Lấy danh sách 8 scenes từ kịch bản hoặc fallback
  const scenes: LessonScene[] = lesson.script?.scenes && lesson.script.scenes.length > 0
    ? lesson.script.scenes
    : [
        {
          sceneId: 1,
          type: 'intro',
          duration: 15,
          characters: ['Cô giáo Mai'],
          chineseText: '欢迎来到中文课堂！',
          pinyin: 'Huānyíng lái dào zhōngwén kètáng!',
          vietnamese: 'Chào mừng các bạn đến với lớp học tiếng Trung!',
          teacherExplanation: 'Chào mừng các bạn đến với bài học hôm nay! Chúng ta sẽ cùng làm quen với các mẫu câu giao tiếp đời sống gần gũi.',
          highlightWords: ['欢迎', '中文'],
          voice: 'female_teacher_vi',
          visualPrompt: 'Khung cảnh lớp học ấm áp, cô giáo mỉm cười chào đón học sinh.',
        },
        {
          sceneId: 2,
          type: 'dialogue',
          duration: 35,
          characters: ['Tiểu Minh', 'Đại Hùng'],
          chineseText: `${lesson.vocabItems[0]?.chinese || '你好'}！你在忙什么呢？\n我正在喝咖啡，顺便复习汉语呢。`,
          pinyin: `${lesson.vocabItems[0]?.pinyin || 'Nǐ hǎo'}! Nǐ zài máng shénme ne?\nWǒ zhèngzài hē kāfēi, shùnbiàn fùxí hànyǔ ne.`,
          vietnamese: `Chào bạn! Bạn đang bận gì thế?\nTôi đang uống cà phê, nhân tiện ôn tập tiếng Trung.`,
          teacherExplanation: 'Cuộc trò chuyện tự nhiên giữa hai người bạn. Hãy chú ý cách dùng từ "在" để diễn tả hành động đang diễn ra.',
          highlightWords: [lesson.vocabItems[0]?.chinese || '你好', '咖啡', '汉语'],
          voice: 'char_a_beijing_female',
          visualPrompt: 'Quán cà phê Bắc Kinh buổi sáng, hai nhân vật trò chuyện vui vẻ.',
        },
      ];

  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  // Highlight Mode: 'word' | 'phrase' | 'sentence' | 'none'
  const [highlightMode, setHighlightMode] = useState<'word' | 'phrase' | 'sentence' | 'none'>('word');
  const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(0);
  const [currentActiveSegment, setCurrentActiveSegment] = useState<AudioSegment | null>(null);

  // Audio Engine & Visual Generator studio toggles
  const [showAudioStudio, setShowAudioStudio] = useState(false);
  const [showVisualStudio, setShowVisualStudio] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [themeStyle, setThemeStyle] = useState<'warm_paper' | 'clean_white' | 'studio_dark'>('warm_paper');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const containerRef = useRef<HTMLDivElement>(null);
  const audioControllerRef = useRef<{ stop: () => void } | null>(null);

  // Phân tích nội dung scene hiện tại thành các lượt thoại (Dialogue Turns)
  const turns: DialogueTurn[] = parseDialogueTurns(
    currentScene.chineseText,
    currentScene.pinyin,
    currentScene.vietnamese,
    currentScene.highlightWords
  );

  // Tự động phát âm thanh và di chuyển highlight khi Scene bắt đầu
  useEffect(() => {
    setActiveTokenIndex(0);
    setActiveSentenceIndex(0);
    setPlaybackSeconds(0);
    setCurrentActiveSegment(null);

    if (isPlaying) {
      playCurrentSceneAudio();
    }
  }, [activeSceneIndex]);

  // Dọn dẹp âm thanh khi unmount
  useEffect(() => {
    return () => {
      audioEngine.stopAudio();
      stopSpeaking();
    };
  }, []);

  // Hàm phát âm thanh đồng bộ với Audio Engine metadata
  const playCurrentSceneAudio = () => {
    if (audioControllerRef.current) {
      audioControllerRef.current.stop();
    }

    const controller = audioEngine.playSceneAudio(
      currentScene,
      (currentTime, activeSeg) => {
        setPlaybackSeconds(Math.floor(currentTime));
        setCurrentActiveSegment(activeSeg);

        if (activeSeg) {
          // Khớp segment với token trong DialogueTurns
          let foundTurnIdx = -1;
          let foundTokenIdx = -1;

          for (let tIdx = 0; tIdx < turns.length; tIdx++) {
            const turn = turns[tIdx];
            for (let tokIdx = 0; tokIdx < turn.tokens.length; tokIdx++) {
              const tokenText = turn.tokens[tokIdx].text;
              if (activeSeg.text.includes(tokenText) || tokenText.includes(activeSeg.text)) {
                foundTurnIdx = tIdx;
                foundTokenIdx = tokIdx;
                break;
              }
            }
            if (foundTurnIdx !== -1) break;
          }

          if (foundTurnIdx !== -1) {
            setActiveSentenceIndex(foundTurnIdx);
            setActiveTokenIndex(foundTokenIdx);
          }
        }
      },
      () => {
        // Tự động chuyển scene tiếp theo
        if (activeSceneIndex < scenes.length - 1) {
          setActiveSceneIndex((s) => s + 1);
        } else {
          setIsPlaying(false);
          setPlaybackSeconds(0);
          setActiveTokenIndex(null);
        }
      }
    );

    audioControllerRef.current = controller;
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.stopAudio();
      stopSpeaking();
    } else {
      setIsPlaying(true);
      playCurrentSceneAudio();
    }
  };

  const handleWordClick = (word: string, index: number) => {
    setActiveTokenIndex(index);
    speakChinese(word, 0.9);
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const sceneMeta = SCENE_TYPE_TITLES[currentScene.type] || {
    title: `SCENE ${currentScene.sceneId}`,
    desc: '',
  };

  const currentAudioMeta = audioEngine.getAudioForScene(currentScene.sceneId);
  const currentVisualMeta = visualEngine.getVisualForScene(currentScene.sceneId);

  return (
    <div className="space-y-5">
      {/* Top Header Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span className="font-semibold text-rose-600 flex items-center gap-1">
              <Tv className="w-3.5 h-3.5" />
              <span>YOUTUBE VIDEO LESSON RENDERER</span>
            </span>
            <span>·</span>
            <span>TEXT OVERLAY HTML/CSS CHUẨN XÁC</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Xem trước nội dung hiển thị bài giảng video
          </h2>
        </div>

        {/* Highlight & Theme Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Chế độ Highlight */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <Highlighter className="w-3 h-3 text-amber-600" />
              <span>Highlight:</span>
            </span>
            <button
              onClick={() => setHighlightMode('word')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                highlightMode === 'word' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Từng từ
            </button>
            <button
              onClick={() => setHighlightMode('phrase')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                highlightMode === 'phrase' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cụm từ khóa
            </button>
            <button
              onClick={() => setHighlightMode('sentence')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                highlightMode === 'sentence' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả câu
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setThemeStyle('warm_paper')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs ${
                themeStyle === 'warm_paper' ? 'bg-white text-amber-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
              title="Phong cách giấy ấm áp YouTube Edu"
            >
              Ấm áp
            </button>
            <button
              onClick={() => setThemeStyle('clean_white')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs ${
                themeStyle === 'clean_white' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
              title="Hiện đại nền trắng sáng"
            >
              Trắng sáng
            </button>
            <button
              onClick={() => setThemeStyle('studio_dark')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs ${
                themeStyle === 'studio_dark' ? 'bg-slate-900 text-white shadow-2xs font-bold' : 'text-slate-600'
              }`}
              title="YouTube Dark Studio"
            >
              Dark Studio
            </button>
          </div>

          {/* Tỷ lệ khung hình */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`px-2 py-1 rounded-md font-mono text-[11px] ${
                aspectRatio === '16:9' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              16:9 (YouTube)
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`px-2 py-1 rounded-md font-mono text-[11px] ${
                aspectRatio === '9:16' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              9:16 (Shorts)
            </button>
          </div>

          {/* Nút bật/tắt Phòng thu TTS */}
          <button
            onClick={() => {
              setShowAudioStudio(!showAudioStudio);
              if (!showAudioStudio) setShowVisualStudio(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all ${
              showAudioStudio
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
            title="Mở phòng thu cấu hình âm thanh Gemini TTS"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Phòng thu TTS</span>
            {currentAudioMeta && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Nút bật/tắt Visual Generator */}
          <button
            onClick={() => {
              setShowVisualStudio(!showVisualStudio);
              if (!showVisualStudio) setShowAudioStudio(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all ${
              showVisualStudio
                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
            title="Mở Visual Generator tạo hình ảnh & video minh họa"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Visual Generator</span>
            {currentVisualMeta && currentVisualMeta.visualMode !== 'no_visual' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* AUDIO ENGINE STUDIO PANEL (Khi người dùng mở) */}
      {showAudioStudio && (
        <AudioEnginePanel
          scenes={scenes}
          currentSceneIndex={activeSceneIndex}
          onSelectScene={(idx) => {
            setActiveSceneIndex(idx);
          }}
          onAudioGenerated={(sceneId, meta) => {
            if (String(currentScene.sceneId) === sceneId) {
              setPlaybackSeconds(0);
            }
          }}
        />
      )}

      {/* VISUAL GENERATOR PANEL (Khi người dùng mở) */}
      {showVisualStudio && (
        <VisualGeneratorPanel
          scenes={scenes}
          currentSceneIndex={activeSceneIndex}
          onSelectScene={(idx) => {
            setActiveSceneIndex(idx);
          }}
          onVisualUpdated={(sceneId, meta) => {
            // Re-render preview
            setActiveSceneIndex((idx) => idx);
          }}
        />
      )}

      {/* SCENE NAVIGATION TABS (Scene 1 to Scene 8) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Chọn Scene:
        </span>
        {scenes.map((s, idx) => {
          const isCurrent = activeSceneIndex === idx;
          const meta = SCENE_TYPE_TITLES[s.type] || { title: `Scene ${s.sceneId}` };
          const hasAudio = Boolean(audioEngine.getAudioForScene(s.sceneId));

          return (
            <button
              key={s.sceneId}
              onClick={() => {
                setActiveSceneIndex(idx);
                audioEngine.stopAudio();
                stopSpeaking();
                setIsPlaying(false);
              }}
              className={`px-3 py-2 rounded-xl text-xs text-left transition-all shrink-0 border flex items-center gap-2 ${
                isCurrent
                  ? 'bg-rose-50 text-rose-950 border-rose-300 font-bold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                isCurrent 
                  ? 'bg-rose-600 text-white' 
                  : hasAudio
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {s.sceneId}
              </span>
              <span className="truncate max-w-[120px]">{meta.title.replace(/^SCENE \d+:\s*/, '')}</span>
              {hasAudio ? (
                <Volume2 className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">({s.duration}s)</span>
              )}
            </button>
          );
        })}
      </div>

      {/* MAIN VIDEO SCREEN CANVAS (HTML / CSS TEXT OVERLAY) */}
      <div className="flex justify-center items-center bg-slate-900/95 rounded-2xl p-3 sm:p-6 overflow-hidden shadow-xl">
        <div
          ref={containerRef}
          className={`relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 flex flex-col justify-between select-none ${
            themeStyle === 'warm_paper'
              ? 'bg-[#FDFCF7] text-slate-900 border-[#E8E3D5]'
              : themeStyle === 'studio_dark'
                ? 'bg-[#0B0F19] text-white border-slate-800'
                : 'bg-white text-slate-900 border-slate-200'
          } ${
            aspectRatio === '9:16'
              ? 'w-full max-w-[360px] aspect-[9/16]'
              : 'w-full max-w-4xl aspect-[16/9]'
          }`}
        >
          {/* Top Video Header: YouTube Brand & Scene Title & Timecode */}
          <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between border-b border-black/5 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span className="font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                {lesson.title}
              </span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[11px] font-mono font-semibold text-rose-700 dark:text-rose-400">
                {sceneMeta.title}
              </span>

              {/* Audio badge */}
              {currentAudioMeta && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-semibold">
                  <Volume2 className="w-3 h-3" />
                  <span>{currentAudioMeta.voice}</span>
                </span>
              )}

              {/* Visual badge */}
              {currentVisualMeta && currentVisualMeta.visualMode !== 'no_visual' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-mono font-semibold">
                  {currentVisualMeta.assetType === 'video' ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  <span>{currentVisualMeta.assetType === 'video' ? 'Veo 16:9' : 'AI Visual'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              <span className="tabular-nums font-semibold">
                {formatSecs(playbackSeconds)} / {formatSecs(currentAudioMeta?.duration || currentScene.duration || 15)}
              </span>
            </div>
          </div>

          {/* VISUAL BACKGROUND LAYER (AI Image / Veo Video / Uploaded) */}
          {currentVisualMeta && currentVisualMeta.visualMode !== 'no_visual' && currentVisualMeta.url && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {currentVisualMeta.assetType === 'video' ? (
                <video
                  src={currentVisualMeta.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-105"
                />
              ) : (
                <img
                  src={currentVisualMeta.url}
                  alt="Scene Background Visual"
                  className="w-full h-full object-cover"
                />
              )}
              {/* Gentle cinematic overlay guaranteeing crisp text contrast */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  themeStyle === 'studio_dark'
                    ? 'bg-gradient-to-t from-slate-950/95 via-slate-950/75 to-slate-950/50'
                    : 'bg-gradient-to-t from-[#FDFCF7]/95 via-[#FDFCF7]/80 to-[#FDFCF7]/60'
                }`}
              />
            </div>
          )}

          {/* MAIN STAGE: DIALOGUE & CONTENT OVERLAY */}
          <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 py-4 overflow-y-auto space-y-4">
            
            {/* If Dialogue turns exist, render each turn with the 3-line layout */}
            {turns.length > 0 ? (
              <div className="space-y-3.5 max-w-3xl mx-auto w-full">
                {turns.map((turn, tIdx) => (
                  <DialogueTurnRenderer
                    key={turn.id}
                    turn={turn}
                    activeTokenIndex={activeSentenceIndex === tIdx ? activeTokenIndex : null}
                    isSentenceHighlighted={highlightMode === 'sentence' && activeSentenceIndex === tIdx}
                    highlightMode={highlightMode}
                    onWordClick={handleWordClick}
                    showPinyin={config.showPinyin}
                    showVietnamese={config.showVietnamese}
                    colorTheme={themeStyle}
                  />
                ))}
              </div>
            ) : (
              /* Fallback Single Hero Card (e.g. for Intro or Summary) */
              <div className="text-center py-6 space-y-3 max-w-lg mx-auto">
                <div className="text-3xl sm:text-5xl font-bold tracking-wide font-sans text-slate-900 dark:text-white">
                  {currentScene.chineseText || lesson.title}
                </div>
                {config.showPinyin && currentScene.pinyin && (
                  <div className="text-base sm:text-xl font-mono text-rose-600 dark:text-rose-400">
                    {currentScene.pinyin}
                  </div>
                )}
                {config.showVietnamese && currentScene.vietnamese && (
                  <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 italic">
                    {currentScene.vietnamese}
                  </div>
                )}
              </div>
            )}

            {/* TEACHER EXPLANATION BOX (Lời giảng bằng tiếng Việt ấm áp, sinh động) */}
            {currentScene.teacherExplanation && (
              <div
                className={`max-w-3xl mx-auto w-full rounded-xl p-3 sm:p-4 border transition-all ${
                  themeStyle === 'studio_dark'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-200'
                    : 'bg-[#FFFDF5] border-[#F2E8C9] text-amber-950'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-700 dark:text-amber-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Lời giảng của giáo viên:</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed opacity-95">
                  "{currentScene.teacherExplanation}"
                </p>
              </div>
            )}

          </div>

          {/* Bottom Player Controller Bar */}
          <div className="p-3 bg-black/5 dark:bg-black/40 backdrop-blur-md border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeSceneIndex > 0) setActiveSceneIndex(activeSceneIndex - 1);
                }}
                disabled={activeSceneIndex === 0}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30 rounded"
                title="Scene trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-2xs"
                title={isPlaying ? 'Tạm dừng' : 'Phát Scene này'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  if (activeSceneIndex < scenes.length - 1) setActiveSceneIndex(activeSceneIndex + 1);
                }}
                disabled={activeSceneIndex === scenes.length - 1}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 disabled:opacity-30 rounded"
                title="Scene tiếp"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => speakChinese(currentScene.chineseText)}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded flex items-center gap-1"
                title="Nghe giọng đọc tiếng Trung"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">Nghe phát âm</span>
              </button>
            </div>

            {/* Current Scene Badge & Characters */}
            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              Nhân vật: <strong>{currentScene.characters.join(', ')}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTokenIndex(0);
                  setPlaybackSeconds(0);
                  playCurrentSceneAudio();
                }}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded"
                title="Phát lại từ đầu Scene này"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quy tắc Render chữ tiếng Trung chuyên nghiệp (YouTube Style):</span>
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
          <li><strong>Dòng 1: Tên nhân vật + Chữ Hán</strong> sử dụng font chữ CJK nét dày, độ tương phản cao, tự động highlight từ khóa hoặc từ đang được đọc.</li>
          <li><strong>Dòng 2: Pinyin</strong> thanh điệu chuẩn xác, căn lề thẳng hàng với chữ Hán tương ứng.</li>
          <li><strong>Dòng 3: Dịch nghĩa tiếng Việt</strong> diễn đạt tự nhiên theo ngữ cảnh bài học, không dịch máy thô ráp.</li>
          <li>Bạn có thể nhấp chuột trực tiếp vào bất kỳ từ tiếng Trung nào trên khung hình để nghe phát âm và xem hiệu ứng highlight tức thì.</li>
        </ul>
      </div>

    </div>
  );
};
