/**
 * Thin wrapper over the Web Speech API (spec: guided tour voice narration).
 * Browser-native TTS — no network, so it works offline in this sandbox and on
 * the client. Prefers an Indian-English voice, then other English voices.
 */

let voices: SpeechSynthesisVoice[] = [];

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function loadVoices() {
  if (!speechSupported()) return;
  voices = window.speechSynthesis.getVoices();
}

if (speechSupported()) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  const byLang = (l: string) => voices.find((v) => v.lang?.toLowerCase().startsWith(l));
  return (
    byLang('en-in') ||
    voices.find((v) => /india|ravi|heera|priya/i.test(v.name)) ||
    byLang('en-gb') ||
    byLang('en-au') ||
    byLang('en-us') ||
    byLang('en') ||
    voices[0]
  );
}

export interface SpeakHandlers {
  onEnd?: () => void;
  onError?: () => void;
}

/** Speak the given text, cancelling any current utterance first. */
export function speak(text: string, handlers: SpeakHandlers = {}): void {
  if (!speechSupported()) {
    handlers.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-IN';
  u.rate = 0.97;
  u.pitch = 1.0;
  u.volume = 1.0;
  u.onend = () => handlers.onEnd?.();
  u.onerror = () => (handlers.onError ?? handlers.onEnd)?.();
  synth.speak(u);
}

export function cancelSpeech(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function pauseSpeech(): void {
  if (speechSupported()) window.speechSynthesis.pause();
}

export function resumeSpeech(): void {
  if (speechSupported()) window.speechSynthesis.resume();
}
