import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from 'lucide-react';
import type {
  AttachmentItem,
  AudioArtifact,
  ChatMessage,
  ChatThread,
  GenGPTModelId,
  GroundingSource,
  MessageArtifact,
  ToolMode,
  UserAccount,
  UserSettings,
} from './types/gengpt';
import { GenGPTIcon } from './components/GenGPTIcon';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatComposer } from './components/ChatComposer';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ArtifactList } from './components/ArtifactCards';
import { LiveCanvasPanel } from './components/LiveCanvasPanel';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { PodcastStudioModal } from './components/PodcastStudioModal';
import { LandingPage } from './components/LandingPage';
import { AuthView } from './components/AuthView';
import { SettingsModal } from './components/SettingsModal';
import { downloadTextFile } from './utils/exportHelpers';

const STORAGE_CHATS_KEY = 'omnigpt_chats';
const STORAGE_SETTINGS_KEY = 'omnigpt_settings';
const STORAGE_SESSION_KEY = 'omnigpt_session';

const DEFAULT_SETTINGS: UserSettings = {
  name: 'Guest',
  theme: 'light',
  tone: 'Friendly',
  language: 'English',
};

const SUGGESTION_CARDS = [
  'Write a CV for a driver job in Ghana',
  "Explain photosynthesis like I'm 5",
  'Build me a Todo App in HTML',
  'Give me 5 business ideas with 500 cedis',
];

const FOLLOW_UP_CHIPS = [
  'Explain simpler',
  'Make it shorter',
  'Give example',
];

function createEmptyThread(modelId: GenGPTModelId): ChatThread {
  const now = Date.now();
  return {
    id: `chat_${now}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'New Chat',
    modelId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function loadChats(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UserSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserAccount) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [view, setView] = useState<'chat' | 'landing' | 'auth'>('chat');
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [user, setUser] = useState<UserAccount | null>(() => loadSession());
  const [threads, setThreads] = useState<ChatThread[]>(() => loadChats());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    const initial = loadChats();
    return initial[0]?.id || null;
  });

  const [selectedModel, setSelectedModel] = useState<GenGPTModelId>('omnigpt-fast');
  const [toolMode, setToolMode] = useState<ToolMode>('auto');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [canvasState, setCanvasState] = useState<{
    open: boolean;
    title: string;
    language: string;
    code: string;
  }>({
    open: false,
    title: 'Live Canvas',
    language: 'html',
    code: '',
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveVoiceOpen, setLiveVoiceOpen] = useState(false);
  const [podcastOpen, setPodcastOpen] = useState(false);

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [ttsAudioMap, setTtsAudioMap] = useState<Record<string, string>>({});

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync light/dark theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist chats to localStorage as omnigpt_chats
  useEffect(() => {
    try {
      const compact = threads.slice(0, 40).map((t) => ({
        ...t,
        messages: t.messages.map((m) => ({
          ...m,
          isStreaming: false,
          attachments: m.attachments?.map((a) => ({
            ...a,
            base64Data: a.base64Data.length > 150000 ? '' : a.base64Data,
            previewUrl:
              a.previewUrl && a.previewUrl.length > 150000
                ? undefined
                : a.previewUrl,
          })),
        })),
      }));
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(compact));
    } catch {
      // ignore quota errors
    }
  }, [threads]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, isStreaming]);

  const handleNewChat = () => {
    if (isStreaming) abortRef.current?.abort();
    setActiveThreadId(null);
    setInput('');
    setAttachments([]);
    setToolMode('auto');
  };

  const handleOpenCanvas = (title: string, language: string, code: string) => {
    setCanvasState({ open: true, title, language, code });
  };

  const handleAddAttachments = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 6);
    const items: AttachmentItem[] = [];

    for (const file of list) {
      const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const mimeType = file.type || 'application/octet-stream';
      const isTextLike =
        mimeType.startsWith('text/') ||
        /\.(txt|md|csv|json|js|ts|tsx|jsx|py|html|css|sql|xml|yaml|yml)$/i.test(
          file.name
        );

      if (isTextLike && file.size < 200000) {
        const textContent = await file.text();
        items.push({
          id,
          name: file.name,
          mimeType,
          size: file.size,
          base64Data: '',
          textContent,
        });
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const base64Data = dataUrl.split(',')[1] || '';
        items.push({
          id,
          name: file.name,
          mimeType,
          size: file.size,
          base64Data,
          previewUrl:
            mimeType.startsWith('image/') || mimeType.startsWith('video/')
              ? dataUrl
              : undefined,
        });
      }
    }

    setAttachments((prev) => [...prev, ...items].slice(0, 8));
  };

  const runChatRequest = async (
    threadId: string,
    conversationMessages: ChatMessage[],
    modelId: GenGPTModelId,
    activeToolMode: ToolMode
  ) => {
    const assistantMsgId = `msg_${Date.now()}_a`;
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      modelId,
      artifacts: [],
      sources: [],
      isStreaming: true,
      statusNote: 'OmniGPT is typing...',
      feedback: null,
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              updatedAt: Date.now(),
              messages: [...conversationMessages, placeholderAssistant],
            }
          : t
      )
    );

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const payloadMessages = conversationMessages.map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((a) => ({
          name: a.name,
          mimeType: a.mimeType,
          base64Data: a.base64Data,
          textContent: a.textContent,
        })),
      }));

      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          modelId,
          toolMode: activeToolMode,
          tone: settings.tone,
          language: settings.language,
          userName: user?.name || settings.name,
        }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Request failed (${resp.status}). Please try again.`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const updateAssistant = (updater: (m: ChatMessage) => ChatMessage) => {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  updatedAt: Date.now(),
                  messages: t.messages.map((m) =>
                    m.id === assistantMsgId ? updater(m) : m
                  ),
                }
              : t
          )
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');

          let eventName = 'message';
          const dataLines: string[] = [];
          for (const line of rawEvent.split('\n')) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trim());
            }
          }

          if (dataLines.length === 0) continue;
          const payloadStr = dataLines.join('\n');
          let parsed: unknown;
          try {
            parsed = JSON.parse(payloadStr);
          } catch {
            continue;
          }

          if (eventName === 'status') {
            const { text } = parsed as { text?: string };
            if (text) updateAssistant((m) => ({ ...m, statusNote: text }));
          } else if (eventName === 'delta') {
            const { text } = parsed as { text?: string };
            if (text) {
              updateAssistant((m) => ({
                ...m,
                content: m.content + text,
                statusNote: undefined,
              }));
            }
          } else if (eventName === 'artifact') {
            const artifact = parsed as MessageArtifact;
            updateAssistant((m) => ({
              ...m,
              artifacts: [...(m.artifacts || []), artifact],
            }));
            if (artifact.type === 'canvas') {
              handleOpenCanvas(artifact.title, artifact.language, artifact.code);
            }
          } else if (eventName === 'sources') {
            const sources = parsed as GroundingSource[];
            updateAssistant((m) => ({ ...m, sources }));
          } else if (eventName === 'error') {
            const { message } = parsed as { message?: string };
            updateAssistant((m) => ({
              ...m,
              error: message || 'Unable to generate response right now.',
              isStreaming: false,
              statusNote: undefined,
            }));
          } else if (eventName === 'done') {
            updateAssistant((m) => ({
              ...m,
              isStreaming: false,
              statusNote: undefined,
            }));
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, isStreaming: false, statusNote: undefined }
                      : m
                  ),
                }
              : t
          )
        );
      } else {
        const message = err instanceof Error ? err.message : 'Network error';
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          error: message,
                          isStreaming: false,
                          statusNote: undefined,
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt ?? input).trim();
    const currentAttachments = overridePrompt ? [] : attachments;

    if (!textToSend && currentAttachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: textToSend,
      createdAt: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    let targetThreadId = activeThreadId;
    let nextHistory: ChatMessage[] = [];

    if (!targetThreadId || !threads.some((t) => t.id === targetThreadId)) {
      const fresh = createEmptyThread(selectedModel);
      fresh.title = (textToSend || currentAttachments[0]?.name || 'New Chat').slice(0, 48);
      fresh.messages = [userMsg];
      targetThreadId = fresh.id;
      nextHistory = [userMsg];
      setThreads((prev) => [fresh, ...prev]);
      setActiveThreadId(fresh.id);
    } else {
      const existing = threads.find((t) => t.id === targetThreadId)!;
      nextHistory = [...existing.messages, userMsg];
      const updatedTitle =
        existing.messages.length === 0
          ? (textToSend || currentAttachments[0]?.name || 'New Chat').slice(0, 48)
          : existing.title;
      setThreads((prev) =>
        prev.map((t) =>
          t.id === targetThreadId
            ? { ...t, title: updatedTitle, updatedAt: Date.now(), messages: nextHistory }
            : t
        )
      );
    }

    if (!overridePrompt) {
      setInput('');
      setAttachments([]);
    }

    await runChatRequest(targetThreadId, nextHistory, selectedModel, toolMode);
  };

  const handleRegenerate = async (assistantMsgId: string) => {
    if (!activeThread || isStreaming) return;
    const idx = activeThread.messages.findIndex((m) => m.id === assistantMsgId);
    if (idx <= 0) return;
    const priorMessages = activeThread.messages.slice(0, idx);
    await runChatRequest(activeThread.id, priorMessages, selectedModel, toolMode);
  };

  const handleFeedback = (msgId: string, vote: 'like' | 'dislike') => {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.id === msgId
                  ? { ...m, feedback: m.feedback === vote ? null : vote }
                  : m
              ),
            }
          : t
      )
    );
  };

  const handleReadAloud = async (msg: ChatMessage) => {
    if (ttsAudioMap[msg.id]) return;
    setTtsLoadingId(msg.id);
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.content,
          voiceName: 'Zephyr',
        }),
      });
      const data = (await resp.json()) as { audioDataUrl?: string };
      if (data.audioDataUrl) {
        setTtsAudioMap((prev) => ({ ...prev, [msg.id]: data.audioDataUrl! }));
      }
    } finally {
      setTtsLoadingId(null);
    }
  };

  const handleShareChat = async () => {
    if (!activeThread) return;
    const transcript = activeThread.messages
      .map((m) => `${m.role === 'user' ? 'User' : 'OmniGPT'}:\n${m.content}`)
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(transcript);
    } catch {
      // fallback download if clipboard blocked
      downloadTextFile(transcript, 'omnigpt-share.md', 'text/markdown;charset=utf-8');
    }
  };

  const handleExportAllChats = () => {
    downloadTextFile(
      JSON.stringify(threads, null, 2),
      'omnigpt-chats-backup.json',
      'application/json;charset=utf-8'
    );
  };

  const handleDeleteAllData = () => {
    localStorage.removeItem(STORAGE_CHATS_KEY);
    localStorage.removeItem(STORAGE_SETTINGS_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    setThreads([]);
    setActiveThreadId(null);
    setSettings(DEFAULT_SETTINGS);
    setUser(null);
  };

  const handlePodcastCreated = (
    title: string,
    script: string,
    artifact: AudioArtifact
  ) => {
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_pod`,
      role: 'assistant',
      content: `### ${title}\n\n${script}`,
      createdAt: Date.now(),
      modelId: selectedModel,
      artifacts: [artifact],
    };

    if (!activeThreadId || !threads.some((t) => t.id === activeThreadId)) {
      const fresh = createEmptyThread(selectedModel);
      fresh.title = title.slice(0, 48);
      fresh.messages = [msg];
      setThreads((prev) => [fresh, ...prev]);
      setActiveThreadId(fresh.id);
    } else {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, updatedAt: Date.now(), messages: [...t.messages, msg] }
            : t
        )
      );
    }
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onStartChat={() => setView('chat')}
        onTryDemo={() => {
          const demo: UserAccount = {
            id: 'demo_user',
            name: 'Demo User',
            email: 'demo@omnigpt.local',
            isDemo: true,
          };
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(demo));
          setUser(demo);
          setView('chat');
        }}
        onOpenAuth={() => setView('auth')}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthView
        onSuccess={(account) => {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(account));
          setUser(account);
          setSettings((s) => ({ ...s, name: account.name }));
          setView('chat');
        }}
        onBack={() => setView('chat')}
      />
    );
  }

  const messages = activeThread?.messages || [];
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec]">
      {/* Dark #171717 Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => {
          if (window.innerWidth < 768) setSidebarOpen(false);
        }}
        onToggleCollapse={() => setSidebarOpen((v) => !v)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={(id) => {
          setActiveThreadId(id);
          const t = threads.find((th) => th.id === id);
          if (t) setSelectedModel(t.modelId);
        }}
        onNewChat={handleNewChat}
        onDeleteThread={(id) => {
          setThreads((prev) => prev.filter((t) => t.id !== id));
          if (activeThreadId === id) setActiveThreadId(null);
        }}
        onRenameThread={(id, title) => {
          setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, title } : t))
          );
        }}
        onClearAllChats={() => {
          setThreads([]);
          setActiveThreadId(null);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setView('auth')}
        onOpenLanding={() => setView('landing')}
        user={user}
        userName={settings.name}
      />

      {/* Main White #FFFFFF (or Dark) Chat Viewport + Optional Split Canvas */}
      <div className="flex-1 min-w-0 h-full flex">
        <div
          className={`flex-1 min-w-0 h-full flex flex-col ${
            canvasState.open ? 'hidden lg:flex lg:w-1/2' : 'w-full'
          }`}
        >
          <TopBar
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
            onNewChat={handleNewChat}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onOpenLiveVoice={() => setLiveVoiceOpen(true)}
            hasCanvas={Boolean(canvasState.code)}
            canvasOpen={canvasState.open}
            onToggleCanvas={() =>
              setCanvasState((s) => ({ ...s, open: !s.open }))
            }
            canShareChat={messages.length > 0}
            onShareChat={handleShareChat}
          />

          {/* Scrollable Message Area */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-4 py-8">
                <div className="w-full max-w-2xl flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#171717] dark:bg-white text-white dark:text-[#0d0d0d] flex items-center justify-center mb-5 text-lg font-bold shadow-xs">
                    O
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance mb-7">
                    What can I help you with?
                  </h1>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                    {SUGGESTION_CARDS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        className="p-4 rounded-2xl border border-black/10 dark:border-white/12 bg-white dark:bg-[#2a2a2a]/60 hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer text-sm font-medium text-[#0d0d0d] dark:text-[#ececec] leading-snug"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[48rem] mx-auto px-3 sm:px-4 py-6 space-y-7">
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex flex-col items-end gap-2">
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-2 max-w-[85%]">
                            {msg.attachments.map((att) =>
                              att.previewUrl && att.mimeType.startsWith('image/') ? (
                                <img
                                  key={att.id}
                                  src={att.previewUrl}
                                  alt={att.name}
                                  referrerPolicy="no-referrer"
                                  className="max-h-52 rounded-2xl border border-black/10 dark:border-white/10 object-cover"
                                />
                              ) : att.previewUrl && att.mimeType.startsWith('video/') ? (
                                <video
                                  key={att.id}
                                  src={att.previewUrl}
                                  controls
                                  className="max-h-56 rounded-2xl border border-black/10 dark:border-white/10 bg-black"
                                />
                              ) : (
                                <div
                                  key={att.id}
                                  className="px-3 py-1.5 rounded-xl bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-black/8 dark:border-white/10 text-xs font-medium"
                                >
                                  {att.name}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {msg.content && (
                          <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const showFollowUps =
                    !msg.isStreaming &&
                    Boolean(msg.content) &&
                    msg.id === lastAssistantId &&
                    !isStreaming;

                  return (
                    <div key={msg.id} className="flex items-start gap-3.5 sm:gap-4">
                      <GenGPTIcon withBadge />

                      <div className="flex-1 min-w-0 pt-0.5">
                        {/* Typing 3-dots indicator while waiting for response */}
                        {msg.isStreaming && !msg.content && (
                          <div className="inline-flex items-center gap-2 text-sm text-[#6e6e80] dark:text-[#9a9aa6]">
                            <span>{msg.statusNote || 'OmniGPT is typing'}</span>
                            <span className="inline-flex items-center gap-1" aria-hidden="true">
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                            </span>
                          </div>
                        )}

                        {msg.content && (
                          <MarkdownRenderer
                            content={msg.content}
                            onOpenCanvas={handleOpenCanvas}
                          />
                        )}

                        {msg.statusNote && msg.content && (
                          <div className="mt-2 inline-flex items-center gap-2 text-xs text-[#6e6e80] dark:text-[#9a9aa6]">
                            <Loader2 className="w-3 h-3 animate-spin text-[#10a37f]" />
                            <span>{msg.statusNote}</span>
                          </div>
                        )}

                        <ArtifactList
                          artifacts={msg.artifacts}
                          sources={msg.sources}
                          onOpenCanvas={handleOpenCanvas}
                        />

                        {msg.error && (
                          <div className="mt-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400 flex flex-wrap items-center justify-between gap-2">
                            <span>{msg.error}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRegenerate(msg.id)}
                                className="px-2.5 py-1 rounded-md bg-red-600 text-white font-medium hover:bg-red-500 cursor-pointer"
                              >
                                Retry
                              </button>
                              <button
                                type="button"
                                onClick={() => setSettingsOpen(true)}
                                className="px-2.5 py-1 rounded-md border border-red-500/30 font-medium hover:bg-red-500/10 cursor-pointer"
                              >
                                Settings
                              </button>
                            </div>
                          </div>
                        )}

                        {ttsAudioMap[msg.id] && (
                          <div className="mt-3 max-w-md">
                            <audio
                              controls
                              autoPlay
                              src={ttsAudioMap[msg.id]}
                              className="w-full h-9"
                            />
                          </div>
                        )}

                        {/* Action Bar under AI response: Copy, Like, Dislike, Regenerate, Read Aloud */}
                        {!msg.isStreaming && msg.content && (
                          <div className="mt-2.5 flex items-center gap-1 text-[#6e6e80] dark:text-[#9a9aa6]">
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard.writeText(msg.content);
                                setCopiedMsgId(msg.id);
                                setTimeout(() => setCopiedMsgId(null), 1600);
                              }}
                              className="p-1.5 rounded-lg hover:bg-black/6 dark:hover:bg-white/8 hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
                              title="Copy"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-4 h-4 text-[#10a37f]" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'like')}
                              className={`p-1.5 rounded-lg hover:bg-black/6 dark:hover:bg-white/8 transition-colors cursor-pointer ${
                                msg.feedback === 'like'
                                  ? 'text-[#10a37f]'
                                  : 'hover:text-[#0d0d0d] dark:hover:text-white'
                              }`}
                              title="Like response"
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'dislike')}
                              className={`p-1.5 rounded-lg hover:bg-black/6 dark:hover:bg-white/8 transition-colors cursor-pointer ${
                                msg.feedback === 'dislike'
                                  ? 'text-red-500'
                                  : 'hover:text-[#0d0d0d] dark:hover:text-white'
                              }`}
                              title="Dislike response"
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRegenerate(msg.id)}
                              className="p-1.5 rounded-lg hover:bg-black/6 dark:hover:bg-white/8 hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
                              title="Regenerate"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReadAloud(msg)}
                              disabled={ttsLoadingId === msg.id}
                              className="p-1.5 rounded-lg hover:bg-black/6 dark:hover:bg-white/8 hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer"
                              title="Read aloud"
                            >
                              {ttsLoadingId === msg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* 3 Interactive Follow-up Chips */}
                        {showFollowUps && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {FOLLOW_UP_CHIPS.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => handleSend(chip)}
                                className="px-3 py-1.5 rounded-full text-xs font-medium border border-black/12 dark:border-white/15 bg-white dark:bg-[#2a2a2a] text-[#37373d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#333] transition-colors cursor-pointer whitespace-nowrap"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </main>

          <ChatComposer
            input={input}
            onChangeInput={setInput}
            attachments={attachments}
            onAddAttachments={handleAddAttachments}
            onRemoveAttachment={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            toolMode={toolMode}
            onChangeToolMode={setToolMode}
            isStreaming={isStreaming}
            onSend={() => handleSend()}
            onStop={() => abortRef.current?.abort()}
          />
        </div>

        {canvasState.open && (
          <div className="w-full lg:w-1/2 h-full shrink-0">
            <LiveCanvasPanel
              title={canvasState.title}
              language={canvasState.language}
              code={canvasState.code}
              onChangeCode={(nextCode) =>
                setCanvasState((s) => ({ ...s, code: nextCode }))
              }
              onClose={() => setCanvasState((s) => ({ ...s, open: false }))}
            />
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(next) => {
          setSettings(next);
          if (user) {
            const updatedUser = { ...user, name: next.name || user.name };
            setUser(updatedUser);
            localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
          }
        }}
        onExportChats={handleExportAllChats}
        onDeleteAllData={handleDeleteAllData}
      />

      <LiveVoiceModal
        isOpen={liveVoiceOpen}
        onClose={() => setLiveVoiceOpen(false)}
      />

      <PodcastStudioModal
        isOpen={podcastOpen}
        onClose={() => setPodcastOpen(false)}
        onPodcastCreated={handlePodcastCreated}
      />
    </div>
  );
}
