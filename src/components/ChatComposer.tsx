import React, { useRef, useState } from 'react';
import {
  ArrowUp,
  Code2,
  FileDown,
  Film,
  Globe,
  Image as ImageIcon,
  Loader2,
  Mic,
  Music,
  Paperclip,
  Square,
  X,
} from 'lucide-react';
import type { AttachmentItem, ToolMode } from '../types/gengpt';
import { formatBytes } from '../utils/exportHelpers';

interface ChatComposerProps {
  input: string;
  onChangeInput: (val: string) => void;
  attachments: AttachmentItem[];
  onAddAttachments: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  toolMode: ToolMode;
  onChangeToolMode: (mode: ToolMode) => void;
  isStreaming: boolean;
  onSend: () => void;
  onStop: () => void;
}

const TOOL_BUTTONS: Array<{
  id: ToolMode;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'search', label: 'Search', icon: Globe },
  { id: 'canvas', label: 'Canvas', icon: Code2 },
  { id: 'visual', label: 'Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Film },
  { id: 'file', label: 'File', icon: FileDown },
  { id: 'music', label: 'Music', icon: Music },
];

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  onChangeInput,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  toolMode,
  onChangeToolMode,
  isStreaming,
  onSend,
  onStop,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(200, el.scrollHeight)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
        onSend();
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };

  const toggleDictation = async () => {
    if (recording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setTranscribing(true);
        try {
          const reader = new FileReader();
          const base64Audio = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const res = String(reader.result || '');
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const resp = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Audio,
              mimeType: blob.type || 'audio/webm',
            }),
          });
          const data = (await resp.json()) as { text?: string };
          if (data.text) {
            onChangeInput(input ? `${input.trim()} ${data.text}` : data.text);
          }
        } catch {
          // ignore
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isStreaming;

  return (
    <div className="w-full max-w-[48rem] mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            onAddAttachments(e.dataTransfer.files);
          }
        }}
        className={`rounded-[26px] bg-[#f4f4f4] dark:bg-[#2f2f2f] border transition-colors px-3.5 pt-3 pb-2.5 shadow-xs ${
          dragOver
            ? 'border-[#10a37f] ring-2 ring-[#10a37f]/25'
            : 'border-black/8 dark:border-white/8'
        }`}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5 px-1">
            {attachments.map((att) => {
              const isVideo = att.mimeType.startsWith('video/');
              const isAudio = att.mimeType.startsWith('audio/');
              return (
                <div
                  key={att.id}
                  className="relative flex items-center gap-2 pl-2 pr-7 py-1.5 rounded-xl bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 text-xs max-w-[230px]"
                >
                  {att.previewUrl && !isVideo ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-[#10a37f]/15 text-[#10a37f] flex items-center justify-center shrink-0 font-mono text-[10px] font-semibold">
                      {isVideo ? 'VID' : isAudio ? 'AUD' : 'FILE'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{att.name}</div>
                    <div className="text-[11px] text-[#8e8ea0] tabular-nums">
                      {formatBytes(att.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    className="absolute right-1.5 top-1.5 p-0.5 rounded-full hover:bg-black/8 dark:hover:bg-white/10 text-[#8e8ea0] cursor-pointer"
                    aria-label={`Remove ${att.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask OmniGPT anything..."
          className="w-full max-h-[200px] px-1.5 py-1 bg-transparent text-[15px] leading-relaxed text-[#0d0d0d] dark:text-[#ececec] placeholder:text-[#8e8ea0] resize-none focus:outline-none"
        />

        <div className="flex items-center justify-between gap-2 mt-2 pt-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.html,.css,.sql,.xml,.yaml,.yml,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  onAddAttachments(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full text-[#444] dark:text-[#d4d4d8] hover:bg-black/6 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Attach image, video, audio, or file"
            >
              <Paperclip className="w-4.5 h-4.5" />
            </button>

            {TOOL_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              const active = toolMode === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onChangeToolMode(active ? 'auto' : btn.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#10a37f]/15 text-[#10a37f] border border-[#10a37f]/35'
                      : 'text-[#555] dark:text-[#b4b4b4] hover:bg-black/6 dark:hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{btn.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleDictation}
              disabled={transcribing}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                recording
                  ? 'bg-red-500 text-white'
                  : 'text-[#444] dark:text-[#d4d4d8] hover:bg-black/6 dark:hover:bg-white/10'
              }`}
              title={recording ? 'Stop recording' : 'Voice input'}
            >
              {transcribing ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Mic className="w-4.5 h-4.5" />
              )}
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                title="Stop Generating"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!canSend}
                onClick={() => {
                  onSend();
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }}
                className="w-9 h-9 rounded-full bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] flex items-center justify-center hover:opacity-90 disabled:opacity-35 transition-opacity cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-center text-[#8e8ea0] mt-2">
        OmniGPT can make mistakes. Verify important information.
      </div>
    </div>
  );
};
