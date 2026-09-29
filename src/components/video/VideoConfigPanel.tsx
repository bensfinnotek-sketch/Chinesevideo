import React from 'react';
import { 
  Sliders, 
  Smartphone, 
  Monitor, 
  Mic2, 
  Palette, 
  Volume2, 
  Check, 
  Layers, 
  Type,
  Music,
  Play
} from 'lucide-react';
import { VideoConfig, AspectRatio, VideoResolution, VideoTheme, VoicePersona } from '../../types/lesson';

interface VideoConfigPanelProps {
  config: VideoConfig;
  onChangeConfig: (newConfig: VideoConfig) => void;
  onPreviewClick: () => void;
  vocabCount: number;
}

export const VideoConfigPanel: React.FC<VideoConfigPanelProps> = ({
  config,
  onChangeConfig,
  onPreviewClick,
  vocabCount
}) => {
  const update = (partial: Partial<VideoConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  const themes: { id: VideoTheme; name: string; desc: string; bgClass: string }[] = [
    {
      id: 'modern_minimal',
      name: 'Hiện đại Tối giản',
      desc: 'Nền slate thanh nhã, chữ Hán nổi bật, phù hợp bài giảng YouTube & khóa học chuyên nghiệp',
      bgClass: 'bg-slate-900 text-white'
    },
    {
      id: 'calligraphy_traditional',
      name: 'Thư pháp Á Đông',
      desc: 'Họa tiết giấy xuyến chỉ cổ phong, con dấu đỏ chu sa, tạo cảm hứng văn hóa Trung Hoa',
      bgClass: 'bg-amber-50 text-amber-950 border border-amber-200'
    },
    {
      id: 'classroom_bright',
      name: 'Lớp học Sinh động',
      desc: 'Màu sắc tươi sáng, viền mềm mại, kích thích sự tập trung của người mới bắt đầu',
      bgClass: 'bg-rose-50 text-rose-950 border border-rose-200'
    },
    {
      id: 'cyber_dark',
      name: 'Cyber EdTech',
      desc: 'Giao diện tối tương phản cao, phong cách công nghệ cao cho giới trẻ',
      bgClass: 'bg-black text-emerald-400 border border-emerald-900'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-600" />
            <span>Cấu hình thông số video bài giảng</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tùy biến định dạng khung hình, phong cách thị giác, giọng đọc AI và các yếu tố hiển thị ngôn ngữ.
          </p>
        </div>

        <button
          onClick={onPreviewClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Play className="w-4 h-4" />
          <span>Xem trước bản dựng video →</span>
        </button>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Tỷ lệ & Độ phân giải */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-500" />
            <span>1. Khung hình & Độ phân giải</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Tỷ lệ khung hình (Aspect Ratio)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update({ aspectRatio: '16:9' })}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  config.aspectRatio === '16:9'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Monitor className={`w-5 h-5 mt-0.5 ${config.aspectRatio === '16:9' ? 'text-rose-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold">16:9 Ngang</div>
                  <div className="text-xs text-slate-500 mt-0.5">YouTube, Máy tính, TV & Máy chiếu lớp học</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => update({ aspectRatio: '9:16' })}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  config.aspectRatio === '9:16'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Smartphone className={`w-5 h-5 mt-0.5 ${config.aspectRatio === '9:16' ? 'text-rose-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm font-semibold">9:16 Dọc</div>
                  <div className="text-xs text-slate-500 mt-0.5">TikTok, Facebook Reels & YouTube Shorts</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Độ phân giải xuất video
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '4k'] as VideoResolution[]).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => update({ resolution: res })}
                  className={`py-2 px-3 rounded-lg border text-center text-xs font-mono tabular-nums transition-all ${
                    config.resolution === res
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {res.toUpperCase()}
                  {res === '1080p' && <span className="block text-[10px] text-slate-400 font-sans">Khuyên dùng</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Giọng đọc & Tốc độ */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-slate-500" />
            <span>2. Giọng đọc AI & Nhịp điệu học tập</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Chọn giọng phát âm tiếng Trung
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'female_kore' as VoicePersona, label: 'Nữ Bắc Kinh (Kore)', sub: 'Trong trẻo, chuẩn thanh' },
                { id: 'male_puck' as VoicePersona, label: 'Nam Bắc Kinh (Puck)', sub: 'Trầm ấm, truyền cảm' },
                { id: 'teacher_duo' as VoicePersona, label: 'Song ngữ Trung - Việt', sub: 'Giải thích chi tiết' }
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => update({ voice: v.id })}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    config.voice === v.id
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold">{v.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{v.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Tốc độ đọc:</span>
                <span className="font-mono tabular-nums text-rose-600">{config.speechSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={config.speechSpeed}
                onChange={(e) => update({ speechSpeed: parseFloat(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>0.75x (Chậm)</span>
                <span>1.0x</span>
                <span>1.25x (Nhanh)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Khoảng nghỉ nhắc lại:</span>
                <span className="font-mono tabular-nums text-rose-600">{config.pauseInterval}s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={config.pauseInterval}
                onChange={(e) => update({ pauseInterval: parseFloat(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>1.0s</span>
                <span>3.0s (Vừa)</span>
                <span>5.0s</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Số lần đọc lặp lại mỗi từ vựng
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => update({ repeatCount: num })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-mono tabular-nums ${
                    config.repeatCount === num
                      ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {num} lần {num === 2 && '(Khuyên dùng)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Phong cách giao diện (Themes) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-500" />
            <span>3. Phong cách thị giác & Màu nền bài học</span>
          </h3>

          <div className="space-y-2">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ theme: t.id })}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  config.theme === t.id
                    ? 'border-rose-600 ring-1 ring-rose-600/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif text-sm font-bold shadow-2xs shrink-0 ${t.bgClass}`}>
                    汉
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{t.desc}</div>
                  </div>
                </div>

                {config.theme === t.id && (
                  <Check className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Tùy chọn hiển thị ngôn ngữ & Nhạc nền */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-slate-500" />
            <span>4. Tùy chọn hiển thị & Nhạc nền (BGM)</span>
          </h3>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="text-slate-700">Hiển thị phiên âm Pinyin phía trên</span>
              <input
                type="checkbox"
                checked={config.showPinyin}
                onChange={(e) => update({ showPinyin: e.target.checked })}
                className="rounded accent-rose-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="text-slate-700">Hiển thị nghĩa dịch tiếng Việt</span>
              <input
                type="checkbox"
                checked={config.showVietnamese}
                onChange={(e) => update({ showVietnamese: e.target.checked })}
                className="rounded accent-rose-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="text-slate-700">Hiển thị âm Hán-Việt (dễ liên tưởng)</span>
              <input
                type="checkbox"
                checked={config.showSinoVietnamese}
                onChange={(e) => update({ showSinoVietnamese: e.target.checked })}
                className="rounded accent-rose-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="text-slate-700">Hoạt họa thứ tự nét bút (Stroke Order)</span>
              <input
                type="checkbox"
                checked={config.showStrokeOrder}
                onChange={(e) => update({ showStrokeOrder: e.target.checked })}
                className="rounded accent-rose-600 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="text-slate-700">Tạo hình ảnh minh họa ngữ cảnh câu</span>
              <input
                type="checkbox"
                checked={config.showAiIllustrations}
                onChange={(e) => update({ showAiIllustrations: e.target.checked })}
                className="rounded accent-rose-600 w-4 h-4"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-slate-400" />
              <span>Nhạc nền nhẹ nhàng (BGM)</span>
            </label>
            <select
              value={config.bgmStyle}
              onChange={(e) => update({ bgmStyle: e.target.value as any })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
            >
              <option value="none">Không dùng nhạc nền (Chỉ giọng đọc)</option>
              <option value="light_study">Nhạc học tập Piano êm dịu (Focus Study)</option>
              <option value="guzheng_calm">Đàn Cổ Tranh Á Đông du dương</option>
              <option value="lofi_acoustic">Lofi Acoustic thư giãn</option>
            </select>
          </div>
        </div>

      </div>

    </div>
  );
};
