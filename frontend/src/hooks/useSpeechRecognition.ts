import { useCallback, useEffect, useRef, useState } from 'react';

const ARABIC_PATTERN = /[؀-ۿ]/;
const MAX_ALTERNATIVES = 5;

// The Web Speech API's SpeechRecognition isn't in TS's default DOM lib yet.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternativeLike> {}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useSpeechRecognition(hintText: string) {
  const RecognitionCtor = getRecognitionConstructor();
  const isSupported = !!RecognitionCtor;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = useCallback(() => {
    if (!RecognitionCtor) return;

    setTranscript('');
    setAlternatives([]);
    const recognition = new RecognitionCtor();
    recognition.lang = ARABIC_PATTERN.test(hintText) ? 'ar-JO' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = MAX_ALTERNATIVES;

    recognition.onresult = (event) => {
      const result = event.results[0];
      const heard: string[] = [];
      for (let i = 0; i < (result?.length ?? 0); i++) {
        const alt = result[i]?.transcript;
        if (alt) heard.push(alt);
      }
      setAlternatives(heard);
      setTranscript(heard[0] ?? '');
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [RecognitionCtor, hintText]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { start, stop, isListening, transcript, alternatives, isSupported };
}
