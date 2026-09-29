import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download,
  Settings2,
  UserCheck
} from 'lucide-react';
import { LessonContent, VideoConfig, VocabItem, SCENE_TYPE_TITLES } from '../../types/lesson';
import { speakChinese, stopSpeaking } from '../../services/audioSynthesis';

interface InteractiveVideoPlayerProps {
  lesson: LessonContent;
  config: VideoConfig;
  onOpenExport: () => void;
  onOpenConfig: () => void;
}

type IntroSlide = {
  type: 'intro';
  title: string;
  subtitle: string;
  content: string;
  duration: number;
};

type VocabSlide = {
  type: 'vocab';
  title: string;
  vocab: VocabItem;
  duration: number;
};

type DialogueSlide = {
  type: 'dialogue';
  title: string;
  dialogue: LessonContent['dialogue'];
  duration: number;
};

type SummarySlide = {
  type: 'summary';
  title: string;
  content: string;
  duration: number;
};

type SceneSlide = {
  type: 'scene';
  title: string;
  sceneId: number;
  duration: number;
  characters: string[];
  chineseText: string;
  pinyin: string;
  vietnamese: string;
  teacherExplanation: string;
  highlightWords: string[];
  voice: string;
};

type VideoSlide = IntroSlide | VocabSlide | DialogueSlide | SummarySlide | SceneSlide;

export const InteractiveVideoPlayer: React.FC<InteractiveVideoPlayerProps> = ({
  lesson,
  config,
  onOpenExport,
  onOpenConfig
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Xây dựng danh sách các Slide: Ưu tiên kịch bản 8 SCENES nếu đã được sinh
  const hasScriptScenes = lesson.script && lesson.script.scenes.length > 0;

  const slides: VideoSlide[] = hasScriptScenes
    ? lesson.script!.scenes.map((s): SceneSlide => ({
        type: 'scene',
        title: SCENE_TYPE_TITLES[s.type]?.title || `Scene ${s.sceneId}`,
        sceneId: s.sceneId,
        duration: Math.max(5, s.duration),
        characters: s.characters,
        chineseText: s.chineseText,
        pinyin: s.pinyin,
        vietnamese: s.vietnamese,
        teacherExplanation: s.teacherExplanation,
        highlightWords: s.highlightWords,
        voice: s.voice,
      }))
    : [
        {
          type: 'intro',
          title: lesson.title,
          subtitle: `${lesson.topic} · ${lesson.level}`,
          content: lesson.intro,
          duration: 5,
        },
        ...lesson.vocabItems.map((item, idx): VocabSlide => ({
          type: 'vocab',
          title: `Từ vựng ${idx + 1}: ${item.chinese}`,
          vocab: item,
          duration: Math.max(4, Math.round(config.pauseInterval * config.repeatCount + 3)),
        })),
        {
          type: 'dialogue',
          title: 'Hội thoại ứng dụng thực tế',
          dialogue: lesson.dialogue,
          duration: 8,
        },
        {
          type: 'summary',
          title: 'Tổng kết bài học',
          content: lesson.summary,
          duration: 5,
        },
      ];

  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);
  const currentSlide: VideoSlide = slides[currentSlideIndex] || slides[0];

  // Tính thời gian hiện tại
  const currentElapsed = slides.slice(0, currentSlideIndex).reduce((acc, s) => acc + s.duration, 0);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Tự động phát âm thanh khi chuyển slide
  useEffect(() => {
    if (!isMuted) {
      if (currentSlide.type === 'scene' && currentSlide.chineseText) {
        speakChinese(currentSlide.chineseText, config.speechSpeed);
      } else if (currentSlide.type === 'vocab' && currentSlide.vocab) {
        speakChinese(currentSlide.vocab.chinese, config.speechSpeed);
      } else if (currentSlide.type === 'dialogue' && currentSlide.dialogue?.[0]) {
        speakChinese(currentSlide.dialogue[0].chinese, config.speechSpeed);
      }
    }
  }, [currentSlideIndex, isMuted, config.speechSpeed]);

  // Vòng lặp phát video
  useEffect(() => {
    if (isPlaying) {
      const slideDurationMs = (currentSlide.duration || 5) * 1000;
      const intervalMs = 100;
      let elapsedInSlide = 0;

      timerRef.current = setInterval(() => {
        elapsedInSlide += intervalMs;
        const totalElapsedSoFar = currentElapsed + (elapsedInSlide / 1000);
        setProgressPercent(Math.min(100, (totalElapsedSoFar / totalDuration) * 100));

        if (elapsedInSlide >= slideDurationMs) {
          if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
          } else {
            setIsPlaying(false);
            stopSpeaking();
          }
        }
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSlideIndex, currentSlide.duration, currentElapsed, totalDuration, slides.length]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeaking();
    } else {
      setIsPlaying(true);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const restartVideo = () => {
    setCurrentSlideIndex(0);
    setProgressPercent(0);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Xác định theme class
  const getThemeClasses = () => {
    switch (config.theme) {
      case 'calligraphy_traditional':
        return 'bg-[#FBF8EF] text-[#2C1810] border-[#E8DFC8] font-serif';
      case 'classroom_bright':
        return 'bg-gradient-to-br from-rose-50 to-orange-50 text-slate-900 border-rose-200';
      case 'cyber_dark':
        return 'bg-black text-emerald-400 border-emerald-950 font-mono';
      case 'modern_minimal':
      default:
        return 'bg-slate-950 text-white border-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span>MÔ PHỎNG VIDEO HOÀN CHỈNH</span>
            <span>·</span>
            <span>{hasScriptScenes ? '8 SCENES SƯ PHẠM' : 'TỪNG TỪ VỰNG'}</span>
            <span>·</span>
            <span>TỶ LỆ {config.aspectRatio}</span>
            <span>·</span>
            <span>{config.resolution.toUpperCase()}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {lesson.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Đổi giao diện / Tỷ lệ</span>
          </button>

          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất video MP4</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="flex justify-center items-center bg-slate-900/90 rounded-2xl p-4 sm:p-8 overflow-hidden shadow-md">
        <div
          ref={playerContainerRef}
          className={`relative overflow-hidden rounded-xl shadow-2xl transition-all flex flex-col justify-between select-none ${getThemeClasses()} ${
            config.aspectRatio === '9:16'
              ? 'w-full max-w-[340px] aspect-[9/16]'
              : 'w-full max-w-4xl aspect-[16/9]'
          }`}
        >
          {/* Watermark branding */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] opacity-70 z-10">
            <span className="font-semibold tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Chinese Video Lesson</span>
            </span>
            <span className="font-mono tabular-nums">
              Slide {currentSlideIndex + 1}/{slides.length}
            </span>
          </div>

          {/* Slide Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
            
            {/* 0. 8-SCENE FORMAT (Kịch bản chuẩn) */}
            {currentSlide.type === 'scene' && (
              <div className="space-y-4 max-w-xl w-full animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded text-[11px] font-mono font-bold uppercase tracking-wider">
                    {currentSlide.title}
                  </span>
                  <span className="text-xs opacity-70 font-mono">
                    ({currentSlide.characters.join(', ')})
                  </span>
                </div>

                {/* Chinese text presentation */}
                {currentSlide.chineseText && (
                  <div className="space-y-1.5 py-2">
                    <div className="text-2xl sm:text-4xl font-bold tracking-wide font-sans whitespace-pre-line drop-shadow">
                      {currentSlide.chineseText}
                    </div>
                    {config.showPinyin && currentSlide.pinyin && (
                      <div className="text-sm sm:text-base font-mono text-rose-400 whitespace-pre-line">
                        {currentSlide.pinyin}
                      </div>
                    )}
                    {config.showVietnamese && currentSlide.vietnamese && (
                      <div className="text-xs sm:text-sm opacity-90 italic whitespace-pre-line max-w-lg mx-auto">
                        {currentSlide.vietnamese}
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Explanation callout */}
                {currentSlide.teacherExplanation && (
                  <div className="p-3.5 bg-black/30 backdrop-blur-xs rounded-xl border border-white/10 text-left space-y-1 text-xs sm:text-sm max-w-lg mx-auto">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Lời giảng giáo viên (Tiếng Việt):</span>
                    </div>
                    <p className="opacity-90 leading-relaxed text-xs">
                      "{currentSlide.teacherExplanation}"
                    </p>
                  </div>
                )}

                {/* Highlight words */}
                {currentSlide.highlightWords && currentSlide.highlightWords.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs opacity-75">
                    <span>Trọng tâm:</span>
                    {currentSlide.highlightWords.map((hw, hIdx) => (
                      <span key={hIdx} className="px-2 py-0.5 bg-white/15 rounded text-white font-semibold">
                        {hw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. INTRO SLIDE (Fallback) */}
            {currentSlide.type === 'intro' && (
              <div className="space-y-4 max-w-md animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-3xl font-bold mx-auto shadow-md">
                  华
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {currentSlide.title}
                </h1>
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                  {currentSlide.content}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                    {currentSlide.subtitle}
                  </span>
                </div>
              </div>
            )}

            {/* 2. VOCAB SLIDE (Fallback) */}
            {currentSlide.type === 'vocab' && currentSlide.vocab && (
              <div className="space-y-4 max-w-lg animate-in zoom-in-95 duration-200">
                {config.showPinyin && currentSlide.vocab.pinyin && (
                  <div className="text-lg sm:text-2xl font-mono text-rose-500 font-medium tracking-widest">
                    {currentSlide.vocab.pinyin}
                  </div>
                )}

                <div className="text-6xl sm:text-8xl font-bold tracking-widest font-sans drop-shadow">
                  {currentSlide.vocab.chinese}
                </div>

                {config.showVietnamese && (
                  <div className="text-xl sm:text-2xl font-semibold opacity-95">
                    {currentSlide.vocab.vietnamese}
                  </div>
                )}

                {currentSlide.vocab.traditionalChinese && currentSlide.vocab.traditionalChinese !== currentSlide.vocab.chinese && (
                  <div className="text-xs sm:text-sm opacity-60 font-serif">
                    Phồn thể: <strong>{currentSlide.vocab.traditionalChinese}</strong>
                  </div>
                )}

                {currentSlide.vocab.exampleChinese && (
                  <div className="mt-4 p-3.5 bg-black/20 backdrop-blur-xs rounded-xl text-left border border-white/10 text-xs sm:text-sm space-y-1">
                    <div className="font-semibold text-rose-400">
                      {currentSlide.vocab.exampleChinese}
                    </div>
                    {config.showPinyin && currentSlide.vocab.examplePinyin && (
                      <div className="opacity-70 font-mono text-[11px]">
                        {currentSlide.vocab.examplePinyin}
                      </div>
                    )}
                    {currentSlide.vocab.exampleVietnamese && (
                      <div className="opacity-80 italic text-xs">
                        {currentSlide.vocab.exampleVietnamese}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 3. DIALOGUE SLIDE (Fallback) */}
            {currentSlide.type === 'dialogue' && (
              <div className="space-y-3 max-w-md w-full animate-in fade-in duration-300">
                <div className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-2">
                  ĐỐI THOẠI THỰC HÀNH ỨNG DỤNG
                </div>
                <div className="space-y-2 text-left">
                  {lesson.dialogue.slice(0, 3).map((line) => (
                    <div key={line.id} className="p-2.5 bg-white/10 rounded-lg text-xs">
                      <div className="font-bold text-rose-400">{line.speaker}:</div>
                      <div className="text-sm font-semibold">{line.chinese}</div>
                      <div className="text-[11px] opacity-70 font-mono">{line.pinyin}</div>
                      <div className="text-[11px] opacity-80 italic">{line.vietnamese}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SUMMARY SLIDE (Fallback) */}
            {currentSlide.type === 'summary' && (
              <div className="space-y-4 max-w-md animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mx-auto">
                  ✓
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  Hoàn thành bài giảng!
                </h2>
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                  {currentSlide.content}
                </p>
                <button
                  onClick={restartVideo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xem lại từ đầu</span>
                </button>
              </div>
            )}

          </div>

          {/* Bottom Control Bar in Video */}
          <div className="p-3 bg-black/40 backdrop-blur-md border-t border-white/10 z-20">
            {/* Progress Bar */}
            <div className="w-full bg-white/20 h-1 rounded-full mb-3 overflow-hidden cursor-pointer">
              <div
                className="bg-rose-500 h-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              {/* Play / Next / Prev */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  disabled={currentSlideIndex === 0}
                  className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-30 transition-colors"
                  title="Slide trước"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors"
                  title={isPlaying ? 'Tạm dừng' : 'Phát bài giảng'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-30 transition-colors"
                  title="Slide tiếp"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Time display */}
              <div className="font-mono tabular-nums text-xs opacity-80">
                {formatTime((progressPercent / 100) * totalDuration)} / {formatTime(totalDuration)}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                title="Toàn màn hình"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
