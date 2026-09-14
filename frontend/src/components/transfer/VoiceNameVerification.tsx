import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Mic, RotateCcw, Volume2, XCircle } from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { matchAny, matchName } from '../../utils/matchName';

interface VoiceNameVerificationProps {
  name: string;
  onVerifiedChange: (verified: boolean) => void;
}

export function VoiceNameVerification({ name, onVerifiedChange }: VoiceNameVerificationProps) {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  const { speak, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis();
  const {
    start,
    isListening,
    transcript,
    alternatives,
    isSupported: sttSupported,
  } = useSpeechRecognition(name);
  const [typedValue, setTypedValue] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    speak(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (alternatives.length === 0) return;
    const isMatch = matchAny(alternatives, firstName);
    setAttempted(true);
    setMatched(isMatch);
    onVerifiedChange(isMatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alternatives]);

  function handleTypedSubmit(e: FormEvent) {
    e.preventDefault();
    const isMatch = matchName(typedValue, firstName);
    setAttempted(true);
    setMatched(isMatch);
    onVerifiedChange(isMatch);
  }

  function retry() {
    setAttempted(false);
    setMatched(false);
    onVerifiedChange(false);
  }

  return (
    <div className="glass-card animate-fade-in-up p-6 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{name}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Say <span className="font-semibold text-gray-700 dark:text-gray-200">"{firstName}"</span> to confirm it's
        them
      </p>

      {ttsSupported && (
        <button
          type="button"
          onClick={() => speak(name)}
          disabled={isSpeaking}
          className="mx-auto mt-3 flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
        >
          <Volume2 size={13} />
          {isSpeaking ? 'Playing…' : 'Play name again'}
        </button>
      )}

      <div className="mt-6">
        {!attempted && sttSupported && (
          <button
            type="button"
            onClick={start}
            disabled={isListening}
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md transition-transform active:scale-95 ${
              isListening
                ? 'animate-pulse bg-rose-500 shadow-rose-500/30'
                : 'bg-linear-to-br from-brand-500 to-brand-600 shadow-brand-500/30'
            }`}
          >
            <Mic size={24} />
          </button>
        )}
        {!attempted && sttSupported && (
          <p className="mt-3 text-xs text-gray-400">{isListening ? 'Listening…' : 'Tap to speak'}</p>
        )}

        {!sttSupported && !attempted && (
          <form onSubmit={handleTypedSubmit} className="mx-auto max-w-xs">
            <p className="mb-2 text-xs text-gray-400">
              Voice input isn't supported in this browser — type the first name instead
            </p>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={`Type "${firstName}"`}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-center text-sm text-gray-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            <button
              type="submit"
              className="mt-3 w-full rounded-xl bg-linear-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
            >
              Check
            </button>
          </form>
        )}

        {attempted && matched && (
          <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={36} />
            <p className="text-sm font-semibold">Matched! You can send now.</p>
          </div>
        )}

        {attempted && !matched && (
          <div className="flex flex-col items-center gap-2">
            <XCircle size={36} className="text-rose-500" />
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Didn't quite catch that — try again
            </p>
            {transcript && (
              <p className="text-xs text-gray-400">
                We heard: <span className="italic">"{transcript}"</span>
              </p>
            )}
            <button
              type="button"
              onClick={retry}
              className="mt-1 flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            >
              <RotateCcw size={13} />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
