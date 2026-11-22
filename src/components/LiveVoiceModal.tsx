import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Languages,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { GenGPTIcon } from './GenGPTIcon';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LiveMode = 'assistant' | 'thinking' | 'translate';

const VOICES = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];
const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ko', label: 'Korean' },
];

function float32ToPcm16Base64(float32: Float32Array): string {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToFloat32Pcm24k(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(bytes.length / 2);
  const out = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    out[i] = view.getInt16(i * 2, true) / 32768;
  }
  return out;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<LiveMode>('assistant');
  const [voice, setVoice] = useState('Zephyr');
  const [targetLang, setTargetLang] = useState('es');
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<
    Array<{ id: string; speaker: 'You' | 'GenGPT'; text: string }>
  >([]);

  const mutedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const videoTimerRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const stopPlaybackQueue = () => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current.clear();
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    }
    setAiSpeaking(false);
  };

  const cleanupSession = () => {
    if (videoTimerRef.current !== null) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    stopPlaybackQueue();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    }
    if (inputCtxRef.current) {
      inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }
    if (outputCtxRef.current) {
      outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupSession();
      return;
    }

    let cancelled = false;
    setStatus('connecting');
    setErrorMsg('');
    setTranscripts([]);

    const startLive = async () => {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        const outputCtx = new AudioCtx({ sampleRate: 24000 });
        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = stream;

        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/live?mode=${encodeURIComponent(
          mode
        )}&voice=${encodeURIComponent(voice)}&targetLang=${encodeURIComponent(targetLang)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
          const msg = JSON.parse(ev.data) as {
            type: string;
            data?: string;
            text?: string;
            message?: string;
          };

          if (msg.type === 'ready') {
            setStatus('ready');
          } else if (msg.type === 'error') {
            setStatus('error');
            setErrorMsg(msg.message || 'Live voice connection failed.');
          } else if (msg.type === 'interrupted') {
            stopPlaybackQueue();
          } else if (msg.type === 'audio' && msg.data && outputCtxRef.current) {
            const floatSamples = base64ToFloat32Pcm24k(msg.data);
            const ctx = outputCtxRef.current;
            const buffer = ctx.createBuffer(1, floatSamples.length, 24000);
            buffer.getChannelData(0).set(floatSamples);

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);

            const startAt = Math.max(ctx.currentTime + 0.01, nextStartTimeRef.current);
            source.start(startAt);
            nextStartTimeRef.current = startAt + buffer.duration;
            activeSourcesRef.current.add(source);
            setAiSpeaking(true);

            source.onended = () => {
              activeSourcesRef.current.delete(source);
              if (activeSourcesRef.current.size === 0) {
                setAiSpeaking(false);
              }
            };
          } else if (msg.type === 'inputTranscript' && msg.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'You') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: `${last.text} ${msg.text}`.trim() },
                ];
              }
              return [
                ...prev.slice(-16),
                { id: `u_${Date.now()}`, speaker: 'You', text: msg.text! },
              ];
            });
          } else if (msg.type === 'outputTranscript' && msg.text) {
            setTranscripts((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'GenGPT') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: `${last.text}${msg.text}` },
                ];
              }
              return [
                ...prev.slice(-16),
                { id: `a_${Date.now()}`, speaker: 'GenGPT', text: msg.text! },
              ];
            });
          }
        };

        ws.onerror = () => {
          setStatus('error');
          setErrorMsg('WebSocket connection error.');
        };

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (mutedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setMicLevel(0);
            return;
          }
          const samples = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
          const rms = Math.sqrt(sum / samples.length);
          setMicLevel(Math.min(1, rms * 6));

          const base64 = float32ToPcm16Base64(samples);
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        };
      } catch (err: unknown) {
        setStatus('error');
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Microphone permission denied or unavailable.'
        );
      }
    };

    startLive();

    return () => {
      cancelled = true;
      cleanupSession();
    };
  }, [isOpen, mode, voice, targetLang]);

  // Live 1 FPS camera vision streaming
  useEffect(() => {
    if (!isOpen || !cameraOn || mode === 'translate') {
      if (videoTimerRef.current !== null) {
        clearInterval(videoTimerRef.current);
        videoTimerRef.current = null;
      }
      if (camStreamRef.current) {
        camStreamRef.current.getTracks().forEach((t) => t.stop());
        camStreamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        camStreamRef.current = stream;
        if (videoElRef.current) {
          videoElRef.current.srcObject = stream;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');

        videoTimerRef.current = window.setInterval(() => {
          if (
            !videoElRef.current ||
            !ctx ||
            !wsRef.current ||
            wsRef.current.readyState !== WebSocket.OPEN
          ) {
            return;
          }
          ctx.drawImage(videoElRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          const base64 = dataUrl.split(',')[1];
          if (base64) {
            wsRef.current.send(JSON.stringify({ video: base64 }));
          }
        }, 1000);
      } catch {
        setCameraOn(false);
      }
    };

    startCamera();
    return () => {
      cancelled = true;
    };
  }, [isOpen, cameraOn, mode]);

  if (!isOpen) return null;

  const orbScale = aiSpeaking ? 1.12 : 1 + micLevel * 0.18;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-md text-white flex flex-col items-center justify-between p-5 sm:p-8">
      {/* Top Controls */}
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <GenGPTIcon size={24} className="text-white" />
          <span className="font-semibold text-base tracking-tight">GenGPT Live</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-white/8 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setMode('assistant')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'assistant' ? 'bg-white text-[#0d0d0d]' : 'text-[#b4b4b4] hover:text-white'
              }`}
            >
              Voice + Vision
            </button>
            <button
              type="button"
              onClick={() => setMode('thinking')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'thinking' ? 'bg-white text-[#0d0d0d]' : 'text-[#b4b4b4] hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Deep Voice
            </button>
            <button
              type="button"
              onClick={() => setMode('translate')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'translate' ? 'bg-white text-[#0d0d0d]' : 'text-[#b4b4b4] hover:text-white'
              }`}
            >
              <Languages className="w-3 h-3" />
              Interpreter
            </button>
          </div>

          {mode === 'translate' ? (
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#171717] text-white">
                  To {l.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              {VOICES.map((v) => (
                <option key={v} value={v} className="bg-[#171717] text-white">
                  Voice: {v}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Center Reactive Orb + Optional Camera + Live Transcript */}
      <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center gap-6 my-4 min-h-0">
        <div className="relative flex items-center justify-center">
          <div
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center transition-transform duration-100"
            style={{
              transform: `scale(${orbScale})`,
              background: aiSpeaking
                ? 'radial-gradient(circle at 35% 35%, #34d399, #10a37f 55%, #065f46 100%)'
                : 'radial-gradient(circle at 35% 35%, #f4f4f5, #a1a1aa 60%, #3f3f46 100%)',
              boxShadow: aiSpeaking
                ? '0 0 65px rgba(16, 163, 127, 0.45)'
                : '0 0 40px rgba(255, 255, 255, 0.12)',
            }}
          >
            {aiSpeaking ? (
              <Volume2 className="w-10 h-10 text-white" />
            ) : (
              <GenGPTIcon size={48} className="text-[#0d0d0d]" />
            )}
          </div>

          {cameraOn && mode !== 'translate' && (
            <video
              ref={videoElRef}
              autoPlay
              muted
              playsInline
              className="w-32 h-24 object-cover rounded-xl border border-white/20 shadow-lg absolute -bottom-4 -right-12 sm:-right-20 bg-black"
            />
          )}
        </div>

        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-white">
            {status === 'connecting'
              ? 'Connecting live audio stream...'
              : status === 'error'
                ? 'Connection failed'
                : aiSpeaking
                  ? 'GenGPT is speaking'
                  : muted
                    ? 'Microphone muted'
                    : mode === 'translate'
                      ? 'Speak naturally for live speech translation'
                      : 'Listening — interrupt anytime'}
          </div>
          {errorMsg && <div className="text-xs text-red-400">{errorMsg}</div>}
        </div>

        {/* Live Transcript Feed */}
        <div className="w-full max-h-44 overflow-y-auto rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-2 text-sm">
          {transcripts.length === 0 ? (
            <div className="text-center text-xs text-[#9a9aa6]">
              Live transcription appears here as you speak.
            </div>
          ) : (
            transcripts.map((t) => (
              <div key={t.id} className="leading-relaxed">
                <span
                  className={`font-semibold mr-2 ${
                    t.speaker === 'GenGPT' ? 'text-[#10a37f]' : 'text-[#d4d4d8]'
                  }`}
                >
                  {t.speaker}:
                </span>
                <span className="text-[#ececec]">{t.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          className={`w-13 h-13 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            muted
              ? 'bg-white text-[#0d0d0d]'
              : 'bg-white/12 text-white hover:bg-white/20'
          }`}
          title={muted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {mode !== 'translate' && (
          <button
            type="button"
            onClick={() => setCameraOn((c) => !c)}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              cameraOn
                ? 'bg-[#10a37f] text-white'
                : 'bg-white/12 text-white hover:bg-white/20'
            }`}
            title={cameraOn ? 'Turn off live camera' : 'Share camera with GenGPT'}
          >
            {cameraOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-13 h-13 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="End live voice session"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
