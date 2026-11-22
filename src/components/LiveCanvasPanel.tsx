import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  Monitor,
  RefreshCw,
  Smartphone,
  Terminal,
  X,
} from 'lucide-react';
import { downloadTextFile, sanitizeFilename } from '../utils/exportHelpers';

interface LiveCanvasPanelProps {
  title: string;
  language: string;
  code: string;
  onChangeCode: (nextCode: string) => void;
  onClose: () => void;
}

export const LiveCanvasPanel: React.FC<LiveCanvasPanelProps> = ({
  title,
  language,
  code,
  onChangeCode,
  onClose,
}) => {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<Array<{ level: string; text: string }>>([]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data && ev.data.__gengptCanvasLog) {
        setLogs((prev) => [
          ...prev.slice(-40),
          { level: ev.data.level || 'log', text: String(ev.data.text || '') },
        ]);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const srcDoc = useMemo(() => {
    const consoleBridge = `<script>
(function(){
  const send = (level, args) => {
    try {
      const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      window.parent.postMessage({ __gengptCanvasLog: true, level, text }, '*');
    } catch (e) {}
  };
  const origLog = console.log, origErr = console.error, origWarn = console.warn;
  console.log = (...a) => { origLog.apply(console, a); send('log', a); };
  console.warn = (...a) => { origWarn.apply(console, a); send('warn', a); };
  console.error = (...a) => { origErr.apply(console, a); send('error', a); };
  window.addEventListener('error', (e) => send('error', [e.message]));
})();
</script>`;

    if (/<head[^>]*>/i.test(code)) {
      return code.replace(/<head[^>]*>/i, (m) => `${m}\n${consoleBridge}`);
    }
    return `<!DOCTYPE html><html><head>${consoleBridge}</head><body style="margin:0">${code}</body></html>`;
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const ext = language === 'svg' ? 'svg' : 'html';
    downloadTextFile(
      code,
      sanitizeFilename(`${title}.${ext}`, `gengpt-canvas.${ext}`),
      ext === 'svg' ? 'image/svg+xml' : 'text/html;charset=utf-8'
    );
  };

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-[#171717] border-l border-black/10 dark:border-white/10">
      {/* Header */}
      <div className="h-14 px-3.5 border-b border-black/8 dark:border-white/8 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center p-0.5 rounded-lg bg-black/5 dark:bg-white/8">
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'preview'
                  ? 'bg-white dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#6e6e80] dark:text-[#9a9aa6] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setTab('code')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'code'
                  ? 'bg-white dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white shadow-xs'
                  : 'text-[#6e6e80] dark:text-[#9a9aa6] hover:text-[#0d0d0d] dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
          </div>
          <span className="text-sm font-medium truncate text-[#0d0d0d] dark:text-[#ececec]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {tab === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setViewport(viewport === 'desktop' ? 'mobile' : 'desktop')}
                className="p-1.5 rounded-lg text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={viewport === 'desktop' ? 'Switch to mobile width' : 'Switch to desktop width'}
              >
                {viewport === 'desktop' ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogs([]);
                  setRefreshKey((k) => k + 1);
                }}
                className="p-1.5 rounded-lg text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Reload preview"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowConsole((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showConsole
                ? 'bg-[#10a37f]/15 text-[#10a37f]'
                : 'text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="Toggle console"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Copy source"
          >
            {copied ? <Check className="w-4 h-4 text-[#10a37f]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#f4f4f5] dark:bg-[#0d0d0d]">
        {tab === 'preview' ? (
          <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-3 overflow-auto">
            <div
              className={`h-full bg-white rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm transition-all duration-200 ${
                viewport === 'mobile' ? 'w-[390px] max-w-full' : 'w-full'
              }`}
            >
              <iframe
                key={refreshKey}
                title={title}
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        ) : (
          <textarea
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full p-4 font-mono text-[13px] leading-relaxed bg-[#fafafa] dark:bg-[#111] text-[#171717] dark:text-[#e5e5e5] resize-none focus:outline-none"
          />
        )}

        {showConsole && (
          <div className="h-36 border-t border-black/10 dark:border-white/10 bg-[#121212] text-[#e5e5e5] font-mono text-xs flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 text-[11px] text-[#9a9aa6]">
              <span>Console ({logs.length})</span>
              <button
                type="button"
                onClick={() => setLogs([])}
                className="hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2.5 space-y-1">
              {logs.length === 0 ? (
                <div className="text-[#6e6e80]">No console output yet.</div>
              ) : (
                logs.map((entry, idx) => (
                  <div
                    key={idx}
                    className={
                      entry.level === 'error'
                        ? 'text-red-400'
                        : entry.level === 'warn'
                          ? 'text-amber-300'
                          : 'text-[#d4d4d8]'
                    }
                  >
                    {entry.text}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
