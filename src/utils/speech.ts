// Web Speech API helper for voice read-aloud designed for low-literacy users

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const stopSpeaking = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch {
      // Ignored
    }
  }
};

export const speakText = (
  text: string,
  lang: string = 'en',
  onStart?: () => void,
  onEnd?: () => void
): boolean => {
  if (!isSpeechSupported()) {
    return false;
  }

  try {
    stopSpeaking();

    // Clean up text for speech: replace symbols, format currency, strip emojis
    const cleanText = text
      .replace(/₹\s*([0-9,]+)/g, '$1 rupees')
      .replace(/[#*•·_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = LANG_MAP[lang] || lang || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = 0.92; // Slightly slower, comfortable pace for clarity
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matched = voices.find(
        (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.startsWith(lang)
      );
      if (matched) {
        utterance.voice = matched;
      }
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      currentUtterance = null;
      if (onEnd) onEnd();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
};
