/**
 * Audio Synthesis Service
 * Hỗ trợ phát âm chữ Hán chuẩn bằng Web Speech API (zh-CN) ngay trên trình duyệt
 * và kiến trúc sẵn sàng kết nối Gemini 3.8 Flash TTS cho âm thanh chất lượng studio.
 */

export function speakChinese(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Trình duyệt không hỗ trợ Web Speech API');
      resolve();
      return;
    }

    // Dừng phát âm trước đó nếu đang chạy
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Tìm giọng đọc tiếng Trung nếu có
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('cmn'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
