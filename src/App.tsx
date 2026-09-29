/**
 * Chinese Video Lesson Maker
 * Pipeline: Upload → Parse → AI Analyze → Editable Lesson Data
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { FileImportSection } from './components/import/FileImportSection';
import { DirectTextInput } from './components/import/DirectTextInput';
import { VocabTable } from './components/parser/VocabTable';
import { LessonPreviewSection } from './components/lesson/LessonPreviewSection';
import { VideoConfigPanel } from './components/video/VideoConfigPanel';
import { InteractiveVideoPlayer } from './components/video/InteractiveVideoPlayer';
import { VideoPreview } from './components/renderer/VideoPreview';
import { AudioEnginePanel } from './components/audio/AudioEnginePanel';
import { VisualGeneratorPanel } from './components/visual/VisualGeneratorPanel';
import { VideoComposerStudio } from './components/composer/VideoComposerStudio';
import { VideoExportModal } from './components/export/VideoExportModal';
import { PipelineOverviewModal } from './components/architecture/PipelineOverviewModal';

import { VocabItem, LessonContent, VideoConfig, UploadedFileSummary, GeneratedLessonPlan } from './types/lesson';
import { SAMPLE_PRESETS } from './services/dictionaryData';
import { analyzeWithGemini, verifyWithGemini, generateLesson } from './services/aiService';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'import' | 'parser' | 'lesson' | 'audio' | 'visual' | 'composer' | 'config' | 'preview'>('parser');
  const [previewMode, setPreviewMode] = useState<'youtube_renderer' | 'slide_player'>('youtube_renderer');

  // Danh sách từ vựng hiện tại (Khởi tạo sẵn với bộ từ mẫu HSK 1 cơ bản theo đúng schema mới)
  const [vocabItems, setVocabItems] = useState<VocabItem[]>(SAMPLE_PRESETS[0].items);

  // Cấu hình video mặc định
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({
    aspectRatio: '16:9',
    resolution: '1080p',
    theme: 'modern_minimal',
    voice: 'female_kore',
    speechSpeed: 1.0,
    pauseInterval: 2.5,
    showPinyin: true,
    showSinoVietnamese: true,
    showVietnamese: true,
    showStrokeOrder: false,
    showAiIllustrations: true,
    repeatCount: 2,
    bgmStyle: 'light_study',
    watermark: 'Chinese Video Lesson'
  });

  // Nội dung bài giảng đã tổng hợp
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);

  // Trạng thái xử lý AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  // Modals & Thông báo
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Tự động tạo bài giảng mẫu ban đầu
  useEffect(() => {
    generateLesson(vocabItems, 'Bài giảng 01: Chào hỏi & Giao tiếp thường nhật').then(lesson => {
      setCurrentLesson(lesson);
    });
  }, []);

  // Tính toán các thông số thống kê
  const verifiedCount = vocabItems.filter(i => i.isAiVerified).length;
  const unverifiedCount = vocabItems.length - verifiedCount;
  const estimatedDurationSeconds = Math.max(
    30,
    vocabItems.length * (videoConfig.pauseInterval * videoConfig.repeatCount + 3) + 20
  );

  // Thông báo toast
  const showToast = (msg: string) => {
    setRecentNotification(msg);
    setTimeout(() => setRecentNotification(null), 4000);
  };

  // Nạp từ file upload
  const handleItemsImported = async (newItems: VocabItem[], fileInfo?: UploadedFileSummary) => {
    // Gộp từ mới tránh trùng
    const existingChinese = new Set(vocabItems.map(p => p.chinese));
    const filteredNew = newItems.filter(n => !existingChinese.has(n.chinese));
    const combined = [...filteredNew, ...vocabItems];

    setVocabItems(combined);
    showToast(`Đã nhận dạng ${filteredNew.length} mục mới. Đang khởi chạy Gemini phân tích...`);
    setActiveTab('parser');

    // Tự động kích hoạt AI phân tích các mục mới nạp
    setIsAnalyzing(true);
    try {
      const analyzed = await analyzeWithGemini(combined);
      setVocabItems(analyzed);
      showToast('Gemini đã phân tích và chuẩn hóa toàn bộ dữ liệu bài học!');
    } catch (err) {
      showToast('Đã lưu dữ liệu thô. Bạn có thể nhấn nút "Gemini phân tích" để thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Thêm trực tiếp từ ô nhập text
  const handleAddDirectItems = async (newItems: VocabItem[]) => {
    const existingChinese = new Set(vocabItems.map(p => p.chinese));
    const filteredNew = newItems.filter(n => !existingChinese.has(n.chinese));
    const combined = [...filteredNew, ...vocabItems];

    setVocabItems(combined);
    showToast(`Đã thêm ${filteredNew.length} mục. Gemini đang chuẩn hóa cấu trúc...`);
    setActiveTab('parser');

    setIsAnalyzing(true);
    try {
      const analyzed = await analyzeWithGemini(combined);
      setVocabItems(analyzed);
      showToast('Gemini đã chuẩn hóa Pinyin, nghĩa tự nhiên và câu ví dụ thành công!');
    } catch (err) {
      console.warn('Lỗi phân tích:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chọn bộ dữ liệu mẫu
  const handleSelectPreset = (index: number) => {
    const preset = SAMPLE_PRESETS[index];
    if (!preset) return;
    setVocabItems(preset.items);
    showToast(`Đã nạp bộ từ vựng: "${preset.label}"`);
    generateLesson(preset.items, `Bài giảng: ${preset.label}`).then(lesson => {
      setCurrentLesson(lesson);
    });
    setActiveTab('parser');
  };

  // Kích hoạt Gemini Phân tích & Chuẩn hóa
  const handleAnalyzeAI = async () => {
    if (vocabItems.length === 0) return;
    setIsAnalyzing(true);
    showToast('Gemini đang phân tích và chuẩn hóa danh sách từ vựng...');

    try {
      const analyzed = await analyzeWithGemini(vocabItems);
      setVocabItems(analyzed);
      if (currentLesson) {
        const updatedLesson = await generateLesson(analyzed, currentLesson.title);
        setCurrentLesson(updatedLesson);
      }
      showToast('Thành công! Tất cả mục đã được chuẩn hóa đầy đủ cấu trúc bài học.');
    } catch (err) {
      showToast('Có lỗi xảy ra khi phân tích dữ liệu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Nút "AI kiểm tra lại" - Gemini rà soát lỗi Pinyin, nghĩa và câu ví dụ
  const handleVerifyAI = async () => {
    if (vocabItems.length === 0) return;
    setIsVerifying(true);
    showToast('Gemini đang thẩm định lỗi Pinyin, nghĩa tiếng Việt và câu ví dụ...');

    try {
      const verified = await verifyWithGemini(vocabItems);
      setVocabItems(verified);
      showToast('Hoàn tất! Gemini đã kiểm tra và hiệu chỉnh toàn bộ dữ liệu.');
    } catch (err) {
      showToast('Không thể kết nối đến dịch vụ thẩm định AI.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Tạo bài giảng
  const handleGenerateLesson = async () => {
    if (vocabItems.length === 0) {
      showToast('Vui lòng thêm ít nhất một mục từ vựng.');
      return;
    }

    setIsGeneratingLesson(true);
    showToast('Đang tổng hợp kịch bản bài giảng và đối thoại ứng dụng...');

    try {
      const lesson = await generateLesson(vocabItems);
      setCurrentLesson(lesson);
      setActiveTab('lesson');
      showToast('Tạo bài giảng thành công!');
    } catch (err) {
      showToast('Có lỗi khi tạo bài giảng.');
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleSaveScriptToLesson = (plan: GeneratedLessonPlan) => {
    setCurrentLesson(prev => {
      if (!prev) return null;
      return {
        ...prev,
        title: plan.title,
        topic: plan.topic,
        script: plan,
      };
    });
    showToast(`Đã đồng bộ kịch bản 8 Scenes cho "${plan.title}".`);
  };

  // Thao tác chỉnh sửa từ vựng
  const handleUpdateItem = (updated: VocabItem) => {
    setVocabItems(prev => prev.map(item => item.id === updated.id ? updated : item));
    showToast(`Đã lưu thay đổi cho "${updated.chinese}".`);
  };

  const handleDeleteItem = (id: string) => {
    setVocabItems(prev => prev.filter(item => item.id !== id));
    showToast('Đã xóa mục khỏi bài học.');
  };

  const handleAddItem = (item: VocabItem) => {
    setVocabItems(prev => [item, ...prev]);
    showToast(`Đã thêm mục "${item.chinese}".`);
  };

  const handleReorderItems = (reordered: VocabItem[]) => {
    setVocabItems(reordered);
    showToast('Đã cập nhật thứ tự bài giảng.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onGenerateLesson={handleGenerateLesson}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        vocabCount={vocabItems.length}
      />

      {/* Toast Notification */}
      {recentNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>{recentNotification}</span>
        </div>
      )}

      {/* Main Workspace with Sidebar & Content */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex">
        
        {/* Responsive Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            vocabCount={vocabItems.length}
            verifiedCount={verifiedCount}
            unverifiedCount={unverifiedCount}
            estimatedDurationSeconds={estimatedDurationSeconds}
            onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
            onAnalyzeAI={handleAnalyzeAI}
            onVerifyAI={handleVerifyAI}
            isAnalyzing={isAnalyzing}
            isVerifying={isVerifying}
          />
        </div>

        {/* Dynamic Main Stage Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-y-auto">
          
          {/* TAB 1: NẠP TÀI LIỆU */}
          {activeTab === 'import' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <FileImportSection
                onItemsImported={handleItemsImported}
                onSelectPreset={handleSelectPreset}
              />

              <div className="pt-2 border-t border-slate-200">
                <DirectTextInput onAddDirectItems={handleAddDirectItems} />
              </div>
            </div>
          )}

          {/* TAB 2: EDITABLE LESSON DATA TABLE */}
          {activeTab === 'parser' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <VocabTable
                items={vocabItems}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onAddItem={handleAddItem}
                onReorderItems={handleReorderItems}
                onAnalyzeAI={handleAnalyzeAI}
                onVerifyAI={handleVerifyAI}
                isAnalyzing={isAnalyzing}
                isVerifying={isVerifying}
                onProceedToLesson={handleGenerateLesson}
              />
            </div>
          )}

          {/* TAB 3: SOẠN BÀI GIẢNG */}
          {activeTab === 'lesson' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <LessonPreviewSection
                lesson={currentLesson}
                items={vocabItems}
                onGenerateLesson={handleGenerateLesson}
                isGenerating={isGeneratingLesson}
                onGoToVideoConfig={() => setActiveTab('config')}
                onSaveScriptToLesson={handleSaveScriptToLesson}
              />
            </div>
          )}

          {/* TAB 4: PHÒNG THU AUDIO / TTS ENGINE */}
          {activeTab === 'audio' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AudioEnginePanel
                scenes={currentLesson?.script?.scenes || []}
                currentSceneIndex={0}
                onAudioGenerated={(sceneId, meta) => {
                  showToast(`Đã tạo audio cho Scene ${sceneId} (${meta.duration}s)!`);
                }}
              />
            </div>
          )}

          {/* TAB 5: VISUAL GENERATOR */}
          {activeTab === 'visual' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <VisualGeneratorPanel
                scenes={currentLesson?.script?.scenes || []}
                currentSceneIndex={0}
                onVisualUpdated={(sceneId, meta) => {
                  showToast(`Đã cập nhật Visual cho Scene ${sceneId} (${meta.assetType.toUpperCase()})!`);
                }}
              />
            </div>
          )}

          {/* TAB 6: VIDEO COMPOSER (MP4) */}
          {activeTab === 'composer' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {currentLesson ? (
                <VideoComposerStudio
                  lesson={currentLesson}
                  scenes={currentLesson?.script?.scenes || []}
                  onUpdateScenes={(updatedScenes) => {
                    if (currentLesson && currentLesson.script) {
                      const updatedLesson: LessonContent = {
                        ...currentLesson,
                        script: {
                          ...currentLesson.script,
                          scenes: updatedScenes,
                        },
                      };
                      setCurrentLesson(updatedLesson);
                      showToast('Đã lưu các thay đổi cho toàn bộ Scenes bài giảng!');
                    }
                  }}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <p className="text-sm text-slate-600">
                    Chưa có bài giảng để dựng video. Bấm "Tạo bài giảng" để bắt đầu!
                  </p>
                  <button
                    onClick={handleGenerateLesson}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Tạo bài giảng ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CẤU HÌNH VIDEO */}
          {activeTab === 'config' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <VideoConfigPanel
                config={videoConfig}
                onChangeConfig={setVideoConfig}
                onPreviewClick={() => setActiveTab('preview')}
                vocabCount={vocabItems.length}
              />
            </div>
          )}

          {/* TAB 5: XEM TRƯỚC BẢN DỰNG VIDEO */}
          {activeTab === 'preview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {currentLesson ? (
                <div className="space-y-4">
                  {/* Mode switcher tabs */}
                  <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                      <button
                        onClick={() => setPreviewMode('youtube_renderer')}
                        className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                          previewMode === 'youtube_renderer'
                            ? 'bg-white text-rose-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        1. YouTube Lesson Renderer (Text Overlay 3 Dòng)
                      </button>
                      <button
                        onClick={() => setPreviewMode('slide_player')}
                        className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                          previewMode === 'slide_player'
                            ? 'bg-white text-slate-900 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        2. Mô phỏng Video toàn cảnh
                      </button>
                    </div>

                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {previewMode === 'youtube_renderer'
                        ? 'Hiển thị chính xác font CJK, Pinyin & Dịch nghĩa'
                        : 'Mô phỏng trình phát MP4 liên tục'}
                    </span>
                  </div>

                  {previewMode === 'youtube_renderer' ? (
                    <VideoPreview
                      lesson={currentLesson}
                      config={videoConfig}
                      onOpenConfig={() => setActiveTab('config')}
                      onOpenExport={() => setIsExportModalOpen(true)}
                    />
                  ) : (
                    <InteractiveVideoPlayer
                      lesson={currentLesson}
                      config={videoConfig}
                      onOpenExport={() => setIsExportModalOpen(true)}
                      onOpenConfig={() => setActiveTab('config')}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <p className="text-sm text-slate-600">
                    Chưa có bài giảng để xem trước. Bấm "Tạo bài giảng" để bắt đầu!
                  </p>
                  <button
                    onClick={handleGenerateLesson}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Tạo bài giảng ngay
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Modal Xuất Video */}
      {currentLesson && (
        <VideoExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          lesson={currentLesson}
          config={videoConfig}
        />
      )}

      {/* Modal Sơ đồ Kiến trúc 8 Bước */}
      <PipelineOverviewModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

    </div>
  );
}
