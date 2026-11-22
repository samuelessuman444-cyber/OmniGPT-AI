import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Layers,
  Music,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import type {
  AudioArtifact,
  CanvasArtifact,
  FileArtifact,
  GroundingSource,
  MessageArtifact,
  MusicArtifact,
  VideoArtifact,
  VisualArtifact,
} from '../types/gengpt';
import {
  downloadBlob,
  downloadTextFile,
  exportSvgAsPng,
  formatBytes,
  parseCsvPreview,
  sanitizeFilename,
} from '../utils/exportHelpers';
import { MusicSynthPlayer, renderMusicToWavBlob } from '../utils/audioSynth';

interface ArtifactListProps {
  artifacts?: MessageArtifact[];
  sources?: GroundingSource[];
  onOpenCanvas: (title: string, language: string, code: string) => void;
}

const FileArtifactCard: React.FC<{ artifact: FileArtifact }> = ({ artifact }) => {
  const [expanded, setExpanded] = useState(false);
  const isCsv =
    artifact.filename.toLowerCase().endsWith('.csv') ||
    artifact.mimeType.includes('csv');

  const csvRows = useMemo(
    () => (isCsv && expanded ? parseCsvPreview(artifact.content, 30) : []),
    [isCsv, expanded, artifact.content]
  );

  const byteSize = useMemo(
    () => new Blob([artifact.content]).size,
    [artifact.content]
  );

  return (
    <div className="my-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#1a1a1a] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#10a37f]/12 text-[#10a37f] flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[#0d0d0d] dark:text-[#ececec] truncate">
              {artifact.filename}
            </div>
            <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6] truncate">
              {artifact.summary} · <span className="tabular-nums">{formatBytes(byteSize)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#444] dark:text-[#ccc] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                artifact.content,
                sanitizeFilename(artifact.filename),
                artifact.mimeType || 'text/plain;charset=utf-8'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/8 dark:border-white/8 max-h-80 overflow-auto bg-white dark:bg-[#111]">
          {isCsv && csvRows.length > 0 ? (
            <table className="w-full text-xs border-collapse tabular-nums">
              <thead>
                <tr className="bg-black/4 dark:bg-white/5">
                  {csvRows[0].map((col, idx) => (
                    <th
                      key={idx}
                      className="px-3 py-2 text-left font-semibold border-b border-black/8 dark:border-white/8 whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(1).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-black/5 dark:border-white/5 hover:bg-black/2 dark:hover:bg-white/3"
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="p-3.5 text-xs font-mono leading-relaxed text-[#171717] dark:text-[#e5e5e5] whitespace-pre-wrap">
              {artifact.content.slice(0, 12000)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

const VisualArtifactCard: React.FC<{
  artifact: VisualArtifact;
  onOpenCanvas: (title: string, language: string, code: string) => void;
}> = ({ artifact, onOpenCanvas }) => {
  const [exporting, setExporting] = useState(false);

  const safeSvg = useMemo(() => {
    return artifact.svgCode.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }, [artifact.svgCode]);

  const handlePngDownload = async () => {
    setExporting(true);
    try {
      await exportSvgAsPng(
        safeSvg,
        artifact.title || 'gengpt-art',
        artifact.width || 1024,
        artifact.height || 1024
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="my-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#1a1a1a] overflow-hidden">
      <div className="p-3 bg-white dark:bg-[#121212] flex items-center justify-center">
        <div
          className="w-full max-w-xl rounded-lg overflow-hidden border border-black/6 dark:border-white/8 [&_svg]:w-full [&_svg]:h-auto [&_svg]:block"
          dangerouslySetInnerHTML={{ __html: safeSvg }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-black/8 dark:border-white/8">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="w-4 h-4 text-[#10a37f] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{artifact.title}</div>
            <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6] truncate tabular-nums">
              {artifact.width} × {artifact.height} · Vector &amp; 2x PNG
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onOpenCanvas(
                artifact.title,
                'svg',
                `<!DOCTYPE html><html><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#111;">${safeSvg}</body></html>`
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#444] dark:text-[#ccc] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5" />
            Canvas
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                safeSvg,
                sanitizeFilename(`${artifact.title}.svg`, 'gengpt-art.svg'),
                'image/svg+xml'
              )
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#444] dark:text-[#ccc] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            SVG
          </button>
          <button
            type="button"
            onClick={handlePngDownload}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoArtifactCard: React.FC<{
  artifact: VideoArtifact;
  onOpenCanvas: (title: string, language: string, code: string) => void;
}> = ({ artifact, onOpenCanvas }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [renderError, setRenderError] = useState('');
  const [exporting, setExporting] = useState(false);

  const renderFn = useMemo(() => {
    try {
      return new Function('ctx', 'width', 'height', 't', 'duration', artifact.renderScript) as (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        t: number,
        duration: number
      ) => void;
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : 'Invalid video script');
      return null;
    }
  }, [artifact.renderScript]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderFn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = (t: number) => {
      try {
        ctx.save();
        renderFn(ctx, artifact.width, artifact.height, t, artifact.durationSeconds);
        ctx.restore();
      } catch (e) {
        setRenderError(e instanceof Error ? e.message : 'Render error');
      }
    };

    if (!playing) {
      drawFrame(currentTime);
      return;
    }

    let lastTs = performance.now();
    let localT = currentTime;

    const tick = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      localT = (localT + dt) % artifact.durationSeconds;
      setCurrentTime(localT);
      drawFrame(localT);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, renderFn, artifact.width, artifact.height, artifact.durationSeconds]);

  const togglePlay = () => {
    setPlaying((p) => {
      const next = !p;
      if (audioRef.current) {
        if (next) {
          audioRef.current.currentTime = currentTime % (audioRef.current.duration || 1);
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
        }
      }
      return next;
    });
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setPlaying(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleExportWebm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !renderFn) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setExporting(true);
    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const donePromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();
      const totalFrames = Math.ceil(artifact.durationSeconds * 30);
      for (let f = 0; f <= totalFrames; f++) {
        const t = (f / 30) % artifact.durationSeconds;
        ctx.save();
        renderFn(ctx, artifact.width, artifact.height, t, artifact.durationSeconds);
        ctx.restore();
        await new Promise((r) => setTimeout(r, 33));
      }
      recorder.stop();
      const blob = await donePromise;
      downloadBlob(blob, sanitizeFilename(`${artifact.title}.webm`, 'gengpt-video.webm'));
    } catch {
      // ignore unsupported browser captureStream errors
    } finally {
      setExporting(false);
    }
  };

  const buildStandaloneHtml = () => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${artifact.title}</title>
<style>body{margin:0;background:#0a0a0a;display:flex;align-items:center;justify-content:center;min-height:100vh}canvas{max-width:100%;max-height:100vh;border-radius:12px}</style>
</head>
<body>
<canvas id="c" width="${artifact.width}" height="${artifact.height}"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const duration = ${artifact.durationSeconds};
function render(ctx, width, height, t, duration) {
${artifact.renderScript}
}
let start = performance.now();
function loop(now){
  const t = ((now - start) / 1000) % duration;
  ctx.save();
  render(ctx, canvas.width, canvas.height, t, duration);
  ctx.restore();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
</script>
</body>
</html>`;

  return (
    <div className="my-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#1a1a1a] overflow-hidden">
      <div className="bg-[#0a0a0a] relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={artifact.width}
          height={artifact.height}
          className="w-full max-h-[420px] object-contain block"
        />
        {renderError && (
          <div className="absolute inset-0 bg-black/80 text-red-400 text-xs font-mono p-4 flex items-center justify-center">
            {renderError}
          </div>
        )}
      </div>

      {/* Playback Scrubber & Controls */}
      <div className="px-4 py-2.5 border-t border-black/8 dark:border-white/8 space-y-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center shrink-0 hover:bg-[#0e8f6f] transition-colors cursor-pointer"
            aria-label={playing ? 'Pause video' : 'Play video'}
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-lg text-[#555] dark:text-[#b4b4b4] hover:bg-black/6 dark:hover:bg-white/10 cursor-pointer"
            title="Restart video"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={0}
            max={artifact.durationSeconds}
            step={0.05}
            value={currentTime}
            onChange={(e) => {
              setPlaying(false);
              setCurrentTime(parseFloat(e.target.value));
            }}
            className="flex-1 accent-[#10a37f] cursor-pointer"
          />
          <span className="text-xs font-mono tabular-nums text-[#6e6e80] dark:text-[#9a9aa6]">
            {currentTime.toFixed(1)}s / {artifact.durationSeconds}s
          </span>
        </div>

        {artifact.voiceoverAudioUrl && (
          <div className="pt-1">
            <audio
              ref={audioRef}
              controls
              src={artifact.voiceoverAudioUrl}
              className="w-full h-8"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            <Film className="w-4 h-4 text-[#10a37f] shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{artifact.title}</div>
              <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6] truncate tabular-nums">
                {artifact.width}×{artifact.height} · {artifact.fps}fps ·{' '}
                {artifact.voiceoverAudioUrl ? 'With AI Voiceover' : 'Motion Graphics'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenCanvas(artifact.title, 'html', buildStandaloneHtml())}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#444] dark:text-[#ccc] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Code2 className="w-3.5 h-3.5" />
              Canvas
            </button>
            <button
              type="button"
              onClick={handleExportWebm}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Recording WebM...' : 'Export WebM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MusicArtifactCard: React.FC<{ artifact: MusicArtifact }> = ({ artifact }) => {
  const playerRef = useRef<MusicSynthPlayer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      playerRef.current?.stop();
    };
  }, []);

  const drawSpectrum = () => {
    const canvas = canvasRef.current;
    const analyser = playerRef.current?.getAnalyser();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (analyser && playing) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const bars = 40;
      const barW = w / bars;
      for (let i = 0; i < bars; i++) {
        const val = data[i * 2] || 0;
        const barH = Math.max(4, (val / 255) * (h - 6));
        ctx.fillStyle = '#10a37f';
        ctx.fillRect(i * barW + 1.5, (h - barH) / 2, Math.max(2, barW - 3), barH);
      }
      rafRef.current = requestAnimationFrame(drawSpectrum);
    }
  };

  useEffect(() => {
    if (playing) {
      drawSpectrum();
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      playerRef.current?.stop();
      setPlaying(false);
      return;
    }
    if (!playerRef.current) {
      playerRef.current = new MusicSynthPlayer();
    }
    setPlaying(true);
    playerRef.current.play(artifact, () => {
      setPlaying(false);
    });
  };

  const handleDownloadWav = async () => {
    setExporting(true);
    try {
      const wavBlob = await renderMusicToWavBlob(artifact);
      downloadBlob(wavBlob, sanitizeFilename(`${artifact.title}.wav`, 'gengpt-track.wav'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="my-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#1a1a1a] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[#10a37f] text-white flex items-center justify-center shrink-0 hover:bg-[#0e8f6f] transition-colors cursor-pointer"
            aria-label={playing ? 'Pause music' : 'Play music'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-[#10a37f] shrink-0" />
              <span className="text-sm font-semibold truncate">{artifact.title}</span>
            </div>
            <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6] truncate tabular-nums">
              {artifact.genre} · {artifact.mood} · {artifact.bpm} BPM · {artifact.keySignature} ·{' '}
              {artifact.tracks?.length || 0} tracks
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadWav}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Rendering...' : 'WAV'}
        </button>
      </div>

      <div className="mt-3 h-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center px-3 overflow-hidden">
        {playing ? (
          <canvas ref={canvasRef} width={480} height={36} className="w-full h-9" />
        ) : (
          <div className="w-full flex items-center gap-1 justify-between opacity-45">
            {Array.from({ length: 36 }).map((_, idx) => (
              <span
                key={idx}
                className="w-1 rounded-full bg-[#10a37f]"
                style={{ height: `${8 + ((idx * 17) % 20)}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AudioArtifactCard: React.FC<{ artifact: AudioArtifact }> = ({ artifact }) => {
  return (
    <div className="my-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#1a1a1a] p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#10a37f]/12 text-[#10a37f] flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{artifact.title}</div>
            {artifact.voice && (
              <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6] truncate">
                Voice: {artifact.voice}
              </div>
            )}
          </div>
        </div>
        <a
          href={artifact.audioDataUrl}
          download={sanitizeFilename(`${artifact.title}.wav`, 'gengpt-audio.wav')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          WAV
        </a>
      </div>
      <audio controls src={artifact.audioDataUrl} className="w-full h-9" />
    </div>
  );
};

const CanvasArtifactCard: React.FC<{
  artifact: CanvasArtifact;
  onOpenCanvas: (title: string, language: string, code: string) => void;
}> = ({ artifact, onOpenCanvas }) => (
  <div className="my-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#1a1a1a] px-4 py-3 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-[#10a37f]/12 text-[#10a37f] flex items-center justify-center shrink-0">
        <Layers className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{artifact.title}</div>
        <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6] truncate">
          {artifact.description}
        </div>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onOpenCanvas(artifact.title, artifact.language, artifact.code)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#10a37f] text-white hover:bg-[#0e8f6f] transition-colors cursor-pointer whitespace-nowrap shrink-0"
    >
      <Play className="w-3.5 h-3.5" />
      Open Canvas
    </button>
  </div>
);

export const ArtifactList: React.FC<ArtifactListProps> = ({
  artifacts,
  sources,
  onOpenCanvas,
}) => {
  return (
    <>
      {artifacts?.map((art) => {
        if (art.type === 'file') {
          return <FileArtifactCard key={art.id} artifact={art} />;
        }
        if (art.type === 'visual') {
          return (
            <VisualArtifactCard
              key={art.id}
              artifact={art}
              onOpenCanvas={onOpenCanvas}
            />
          );
        }
        if (art.type === 'video') {
          return (
            <VideoArtifactCard
              key={art.id}
              artifact={art}
              onOpenCanvas={onOpenCanvas}
            />
          );
        }
        if (art.type === 'music') {
          return <MusicArtifactCard key={art.id} artifact={art} />;
        }
        if (art.type === 'audio') {
          return <AudioArtifactCard key={art.id} artifact={art} />;
        }
        if (art.type === 'canvas') {
          return (
            <CanvasArtifactCard
              key={art.id}
              artifact={art}
              onOpenCanvas={onOpenCanvas}
            />
          );
        }
        return null;
      })}

      {sources && sources.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-black/8 dark:border-white/8">
          <div className="text-xs font-medium text-[#6e6e80] dark:text-[#9a9aa6] mb-1.5">
            Sources
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            {sources.map((src, idx) => (
              <a
                key={`${src.uri}_${idx}`}
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#555] dark:text-[#b4b4b4] hover:text-[#10a37f] dark:hover:text-[#10a37f] transition-colors max-w-[260px] truncate"
              >
                <span className="truncate">{src.title}</span>
                <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
