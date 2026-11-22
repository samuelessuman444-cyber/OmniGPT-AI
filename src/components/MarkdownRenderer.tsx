import React, { useMemo, useState } from 'react';
import { marked, type Token } from 'marked';
import { Check, Copy, Download, Play } from 'lucide-react';
import { downloadTextFile } from '../utils/exportHelpers';

interface MarkdownRendererProps {
  content: string;
  onOpenCanvas?: (title: string, language: string, code: string) => void;
}

const EXT_MAP: Record<string, string> = {
  html: 'html',
  htm: 'html',
  svg: 'svg',
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  tsx: 'tsx',
  jsx: 'jsx',
  python: 'py',
  py: 'py',
  css: 'css',
  json: 'json',
  markdown: 'md',
  md: 'md',
  sql: 'sql',
  bash: 'sh',
  sh: 'sh',
  yaml: 'yml',
  yml: 'yml',
  xml: 'xml',
  csv: 'csv',
};

function wrapCodeForCanvas(language: string, code: string): string {
  const lang = language.toLowerCase();
  if (lang === 'html' || lang === 'htm') return code;
  if (lang === 'svg') {
    return `<!DOCTYPE html><html><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#111;">${code}</body></html>`;
  }
  if (lang === 'javascript' || lang === 'js') {
    return `<!DOCTYPE html><html><head><style>body{font-family:system-ui,sans-serif;background:#141414;color:#eee;padding:24px;margin:0}pre{background:#1e1e1e;padding:16px;border-radius:10px;overflow:auto}</style></head><body><div id="app"></div><pre id="out"></pre><script>const log=(...a)=>{document.getElementById('out').textContent+=a.map(x=>typeof x==='object'?JSON.stringify(x,null,2):String(x)).join(' ')+'\\n'};console.log=log;\n${code}\n</script></body></html>`;
  }
  return code;
}

const CodeBlockCard: React.FC<{
  language: string;
  code: string;
  onOpenCanvas?: (title: string, language: string, code: string) => void;
}> = ({ language, code, onOpenCanvas }) => {
  const [copied, setCopied] = useState(false);
  const lang = (language || 'text').toLowerCase();
  const isHtml = lang === 'html' || lang === 'htm';
  const canPreview = ['html', 'htm', 'svg', 'javascript', 'js'].includes(lang);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const ext = EXT_MAP[lang] || 'txt';
    downloadTextFile(
      code,
      isHtml ? 'omnigpt-app.html' : `omnigpt-code.${ext}`,
      isHtml ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8'
    );
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#ececf1] dark:bg-[#1e1e1e] border-b border-black/8 dark:border-white/8 text-xs text-[#5d5d67] dark:text-[#b4b4b4]">
        <span className="font-mono font-medium lowercase select-none">{lang || 'code'}</span>
        <div className="flex items-center gap-1.5">
          {canPreview && onOpenCanvas && (
            <button
              type="button"
              onClick={() =>
                onOpenCanvas(
                  `${lang.toUpperCase()} Live Preview`,
                  lang === 'svg' ? 'svg' : 'html',
                  wrapCodeForCanvas(lang, code)
                )
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#10a37f] hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title={isHtml ? 'Download .html' : 'Download file'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isHtml ? 'Download .html' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10a37f]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-[#171717] dark:text-[#e5e5e5]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onOpenCanvas }) => {
  const segments = useMemo(() => {
    const tokens = marked.lexer(content || '');
    const out: Array<
      | { kind: 'html'; html: string }
      | { kind: 'code'; lang: string; text: string }
    > = [];
    let htmlBuffer: Token[] = [];

    const flushHtml = () => {
      if (htmlBuffer.length === 0) return;
      const mdChunk = htmlBuffer.map((t) => t.raw).join('');
      const parsed = marked.parse(mdChunk, {
        gfm: true,
        breaks: true,
      }) as string;
      const safe = parsed.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, (m) =>
        escapeHtml(m)
      );
      out.push({ kind: 'html', html: safe });
      htmlBuffer = [];
    };

    for (const token of tokens) {
      if (token.type === 'code') {
        flushHtml();
        out.push({
          kind: 'code',
          lang: token.lang || 'text',
          text: token.text || '',
        });
      } else {
        htmlBuffer.push(token);
      }
    }
    flushHtml();
    return out;
  }, [content]);

  return (
    <div className="gengpt-prose break-words">
      {segments.map((seg, i) =>
        seg.kind === 'code' ? (
          <CodeBlockCard
            key={`code_${i}`}
            language={seg.lang}
            code={seg.text}
            onOpenCanvas={onOpenCanvas}
          />
        ) : (
          <div
            key={`html_${i}`}
            dangerouslySetInnerHTML={{ __html: seg.html }}
          />
        )
      )}
    </div>
  );
};
