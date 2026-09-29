import React from 'react';
import { Download, Edit3, Film, RefreshCw, Settings2, Volume2 } from 'lucide-react';
import { LessonScene } from '../../types/lesson';
import { VideoFormat, VideoComposerConfig, TransitionType } from '../../types/composer';
import { AudioSegment, TTSSpeedMode } from '../../services/audioEngine/types';
import { audioEngine } from '../../services/audioEngine/audioEngineService';
import { visualEngine } from '../../services/visualEngine/visualEngineService';
import { AVAILABLE_VOICES } from '../../services/audioEngine/voicePresets';

type InspectorTab = 'content' | 'audio' | 'visual' | 'export';

interface SceneInspectorProps {
  currentScene?: LessonScene;
  activeAudioSegment: AudioSegment | null;
  previewCurrentTime: number;
  composerConfig: VideoComposerConfig;
  setComposerConfig: React.Dispatch<React.SetStateAction<VideoComposerConfig>>;
  inspectorTab: InspectorTab;
  setInspectorTab: React.Dispatch<React.SetStateAction<InspectorTab>>;
  isEditingScene: boolean;
  setIsEditingScene: React.Dispatch<React.SetStateAction<boolean>>;
  editedChinese: string;
  setEditedChinese: React.Dispatch<React.SetStateAction<string>>;
  editedPinyin: string;
  setEditedPinyin: React.Dispatch<React.SetStateAction<string>>;
  editedVietnamese: string;
  setEditedVietnamese: React.Dispatch<React.SetStateAction<string>>;
  editedExplanation: string;
  setEditedExplanation: React.Dispatch<React.SetStateAction<string>>;
  editedDuration: number;
  setEditedDuration: React.Dispatch<React.SetStateAction<number>>;
  editedVoice: string;
  setEditedVoice: React.Dispatch<React.SetStateAction<string>>;
  editedSpeed: TTSSpeedMode;
  setEditedSpeed: React.Dispatch<React.SetStateAction<TTSSpeedMode>>;
  handleSaveSceneEdits: () => void;
  handleRegenerateScene: () => Promise<void>;
  handleRegenerateAudio: () => Promise<void>;
  handleRegenerateVisual: () => Promise<void>;
  handleStartExport: () => Promise<void>;
  drawCurrentCanvasFrame: (timeInSec: number) => void;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  currentScene,
  activeAudioSegment,
  previewCurrentTime,
  composerConfig,
  setComposerConfig,
  inspectorTab,
  setInspectorTab,
  isEditingScene,
  setIsEditingScene,
  editedChinese,
  setEditedChinese,
  editedPinyin,
  setEditedPinyin,
  editedVietnamese,
  setEditedVietnamese,
  editedExplanation,
  setEditedExplanation,
  editedDuration,
  setEditedDuration,
  editedVoice,
  setEditedVoice,
  editedSpeed,
  setEditedSpeed,
  handleSaveSceneEdits,
  handleRegenerateScene,
  handleRegenerateAudio,
  handleRegenerateVisual,
  handleStartExport,
  drawCurrentCanvasFrame,
}) => (
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
          
          {/* Header of Inspector */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                SCENE INSPECTOR
              </div>
              <h4 className="text-base font-bold text-slate-900">
                SCENE {currentScene?.sceneId}: {currentScene?.type.toUpperCase()}
              </h4>
            </div>

            <button
              onClick={() => setIsEditingScene(!isEditingScene)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                isEditingScene
                  ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingScene ? 'Đóng soạn thảo' : 'Chỉnh sửa'}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              ['content', 'Nội dung', Edit3], ['audio', 'Audio', Volume2], ['visual', 'Visual', Film], ['export', 'Export', Settings2],
            ].map(([key, label, Icon]: any) => (
              <button key={key} onClick={() => setInspectorTab(key)} className={`px-2 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 ${inspectorTab === key ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'}`}>
                <Icon className="w-3.5 h-3.5" /><span>{label}</span>
              </button>
            ))}
          </div>

          {inspectorTab === 'content' && (
          <>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={handleRegenerateScene}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex flex-col items-center gap-1"
              title="Tái tạo lại nội dung Scene"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Regen Scene</span>
            </button>

            <button
              onClick={handleRegenerateAudio}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex flex-col items-center gap-1"
              title="Tái tạo lại giọng đọc TTS"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Regen Audio</span>
            </button>

            <button
              onClick={handleRegenerateVisual}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex flex-col items-center gap-1"
              title="Tái tạo lại hình ảnh / video B-roll"
            >
              <Film className="w-3.5 h-3.5 text-blue-500" />
              <span>Regen Visual</span>
            </button>
          </div>

          {/* Inline Edit Form */}
          {isEditingScene ? (
            <div className="space-y-3.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in">
              {/* Chinese text */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">1. Chữ Hán (Chinese text):</label>
                <textarea
                  value={editedChinese}
                  onChange={(e) => setEditedChinese(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900"
                />
              </div>

              {/* Pinyin */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">2. Pinyin có dấu thanh:</label>
                <input
                  type="text"
                  value={editedPinyin}
                  onChange={(e) => setEditedPinyin(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-rose-600"
                />
              </div>

              {/* Vietnamese */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">3. Dịch nghĩa tiếng Việt:</label>
                <input
                  type="text"
                  value={editedVietnamese}
                  onChange={(e) => setEditedVietnamese(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              {/* Teacher explanation */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">4. Giảng giải tiếng Việt:</label>
                <textarea
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              {/* Duration, Speed & Voice */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Thời lượng (giây):</label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={editedDuration}
                    onChange={(e) => setEditedDuration(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tốc độ đọc:</label>
                  <select
                    value={editedSpeed}
                    onChange={(e) => setEditedSpeed(e.target.value as TTSSpeedMode)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="normal">Normal (1.0x)</option>
                    <option value="slow">Slow (0.8x)</option>
                    <option value="very_slow">Very Slow (0.65x)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Giọng đọc (Voice):</label>
                  <select
                    value={editedVoice}
                    onChange={(e) => setEditedVoice(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {AVAILABLE_VOICES.map((v) => (
                      <option key={v.id} value={v.name.split(' ')[0]}>
                        {v.name} ({v.language})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save button */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingScene(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveSceneEdits}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-2xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            /* 10 Layers Status Display */
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Layers</span>
                <span className="font-normal normal-case text-slate-400">10 thành phần</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ['Visual', visualEngine.getVisualForScene(currentScene?.sceneId)?.assetType?.toUpperCase() || 'Warm Paper'],
                  ['Chinese', currentScene?.chineseText || '—'],
                  ['Pinyin', currentScene?.pinyin || '—'],
                  ['Vietnamese', currentScene?.vietnamese || '—'],
                  ['Speaker', currentScene?.characters?.join(', ') || 'Giáo viên'],
                  ['Karaoke', activeAudioSegment?.type === 'chinese_dialogue' ? 'Đang đọc' : 'Ready'],
                  ['Explanation', currentScene?.teacherExplanation ? 'Có' : 'Không'],
                  ['TTS', String(audioEngine.getAudioForScene(currentScene?.sceneId)?.duration || currentScene?.duration || 0) + 's'],
                  ['SFX', composerConfig.enableChimeSoundEffect ? 'Chime' : 'Off'],
                  ['Transition', composerConfig.enableTransitions ? composerConfig.transitionType + ' · ' + composerConfig.transitionDurationSec + 's' : 'Off'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                    <div className="mt-0.5 truncate text-[11px] font-medium text-slate-700">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}

          {inspectorTab === 'audio' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-800">TTS & Karaoke</span><span className="text-[10px] font-mono text-emerald-600">{audioEngine.getAudioForScene(currentScene?.sceneId)?.duration || currentScene?.duration || 0}s</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-medium text-slate-600">Voice
                    <select value={editedVoice} onChange={e => { setEditedVoice(e.target.value); audioEngine.updateSettings({ chineseTeacherVoice: e.target.value }); }} className="mt-1 w-full p-2 rounded-lg border border-slate-200 bg-white text-xs">
                      {AVAILABLE_VOICES.filter(v => v.language === 'zh-CN').map(v => <option key={v.id} value={v.geminiVoiceName || v.name.split(' ')[0]}>{v.name}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] font-medium text-slate-600">Speed
                    <select value={editedSpeed} onChange={e => { const value=e.target.value as TTSSpeedMode; setEditedSpeed(value); audioEngine.updateSettings({ speedMode:value }); }} className="mt-1 w-full p-2 rounded-lg border border-slate-200 bg-white text-xs">
                      <option value="normal">1.0x · Normal</option><option value="slow">0.8x · Slow</option><option value="very_slow">0.65x · Very slow</option>
                    </select>
                  </label>
                </div>
                <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600"><span>Đọc Pinyin</span><input type="checkbox" checked={audioEngine.getSettings().includePinyinAudio} onChange={e => audioEngine.updateSettings({ includePinyinAudio:e.target.checked })} /></label>
              </div>
              <button onClick={handleRegenerateAudio} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Tạo lại Audio Scene</button>
            </div>
          )}

          {inspectorTab === 'visual' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="text-xs font-bold text-slate-800">Visual Scene</div>
                <label className="text-[11px] font-medium text-slate-600 block">Theme
                  <select value={composerConfig.themeStyle} onChange={e => { const value=e.target.value as VideoComposerConfig['themeStyle']; setComposerConfig({...composerConfig, themeStyle:value}); setTimeout(() => drawCurrentCanvasFrame(previewCurrentTime),50); }} className="mt-1 w-full p-2 rounded-lg border border-slate-200 bg-white text-xs">
                    <option value="warm_paper">Warm paper</option><option value="studio_dark">Studio dark</option><option value="clean_white">Clean white</option>
                  </select>
                </label>
                <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 truncate">Prompt: {currentScene?.visualPrompt || 'Chưa có visual prompt'}</div>
              </div>
              <button onClick={handleRegenerateVisual} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Tạo lại Visual Scene</button>
            </div>
          )}

          {inspectorTab === 'export' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="text-xs font-bold text-slate-800">Video Output</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['16:9','9:16','1:1'] as VideoFormat[]).map(format => (
                    <button key={format} onClick={() => { setComposerConfig({...composerConfig, format}); setTimeout(() => drawCurrentCanvasFrame(previewCurrentTime),50); }} className={`py-2 rounded-lg border text-[11px] font-bold ${composerConfig.format === format ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600'}`}>{format}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-medium text-slate-600">FPS
                    <select value={composerConfig.fps} onChange={e => setComposerConfig({...composerConfig, fps:Number(e.target.value)})} className="mt-1 w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"><option value={24}>24 fps</option><option value={30}>30 fps</option></select>
                  </label>
                  <label className="text-[11px] font-medium text-slate-600">Transition
                    <select value={composerConfig.transitionType} onChange={e => setComposerConfig({...composerConfig, transitionType:e.target.value as TransitionType})} className="mt-1 w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"><option value="crossfade">Crossfade</option><option value="dip_to_black">Dip to black</option><option value="slide_left">Slide left</option><option value="cut">Cut</option></select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600"><span>Safe area</span><input type="checkbox" checked={composerConfig.showSafeAreaGuide} onChange={e => {setComposerConfig({...composerConfig, showSafeAreaGuide:e.target.checked}); setTimeout(()=>drawCurrentCanvasFrame(previewCurrentTime),50);}} /></label>
                  <label className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600"><span>Transitions</span><input type="checkbox" checked={composerConfig.enableTransitions} onChange={e => setComposerConfig({...composerConfig, enableTransitions:e.target.checked})} /></label>
                </div>
              </div>
              <button onClick={handleStartExport} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2"><Download className="w-3.5 h-3.5" /> Xuất video</button>
            </div>
          )}

        </div>

);
