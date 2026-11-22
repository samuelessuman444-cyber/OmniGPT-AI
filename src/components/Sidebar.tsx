import React, { useMemo, useState } from 'react';
import {
  Check,
  LayoutGrid,
  LogIn,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type { ChatThread, UserAccount } from '../types/gengpt';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, title: string) => void;
  onClearAllChats: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenLanding: () => void;
  user: UserAccount | null;
  userName: string;
}

function getDateGroup(ts: number): 'Today' | 'Previous 7 days' | 'Previous 30 days' | 'Older' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 86400000;
  if (ts >= startOfToday) return 'Today';
  if (ts >= startOfToday - 7 * oneDay) return 'Previous 7 days';
  if (ts >= startOfToday - 30 * oneDay) return 'Previous 30 days';
  return 'Older';
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onCloseMobile,
  onToggleCollapse,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onRenameThread,
  onClearAllChats,
  onOpenSettings,
  onOpenAuth,
  onOpenLanding,
  user,
  userName,
}) => {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = threads
      .filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.messages.some((m) => m.content.toLowerCase().includes(q))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const groups: Record<string, ChatThread[]> = {
      Today: [],
      'Previous 7 days': [],
      'Previous 30 days': [],
      Older: [],
    };

    for (const t of filtered) {
      groups[getDateGroup(t.updatedAt)].push(t);
    }
    return groups;
  }, [threads, query]);

  const startRename = (t: ChatThread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(t.id);
    setDraftTitle(t.title);
  };

  const commitRename = (id: string) => {
    const trimmed = draftTitle.trim();
    if (trimmed) onRenameThread(id, trimmed);
    setEditingId(null);
  };

  const displayName = user?.name || userName || 'Guest';

  const sidebarContent = (
    <div className="w-[260px] h-full flex flex-col bg-[#171717] text-[#ececec] border-r border-white/8 select-none">
      {/* Top Row: New Chat white button + Collapse */}
      <div className="p-3 flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white text-[#0d0d0d] text-sm font-semibold hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-[#b4b4b4] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Search Box */}
      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8e8ea0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white/8 text-[#ececec] placeholder:text-[#8e8ea0] focus:outline-none focus:ring-1 focus:ring-white/25"
          />
        </div>
      </div>

      {/* Grouped Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {threads.length === 0 ? (
          <div className="px-3 py-6 text-xs text-[#8e8ea0] text-center">
            Your conversations will appear here.
          </div>
        ) : (
          Object.entries(grouped).map(([label, list]) => {
            if (list.length === 0) return null;
            return (
              <div key={label} className="space-y-0.5">
                <div className="px-2.5 pb-1 text-[11px] font-medium text-[#8e8ea0]">
                  {label}
                </div>
                {list.map((t) => {
                  const active = t.id === activeThreadId;
                  const isEditing = editingId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (!isEditing) {
                          onSelectThread(t.id);
                          onCloseMobile();
                        }
                      }}
                      className={`group flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#2a2a2a] text-white font-medium'
                          : 'text-[#d4d4d8] hover:bg-white/8'
                      }`}
                    >
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(t.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 min-w-0 bg-[#111] px-2 py-0.5 rounded text-xs border border-[#10a37f] text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => commitRename(t.id)}
                            className="p-1 text-[#10a37f] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 text-[#8e8ea0] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate flex-1">{t.title}</span>
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => startRename(t, e)}
                              className="p-1 rounded hover:bg-white/10 text-[#9a9aa6] hover:text-white cursor-pointer"
                              title="Rename chat"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteThread(t.id);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-[#9a9aa6] hover:text-red-400 cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Controls: Clear All Chats, Overview/Pricing, Settings, User Profile */}
      <div className="p-2.5 border-t border-white/10 space-y-1 shrink-0">
        {threads.length > 0 && (
          confirmClear ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-red-500/15 text-xs">
              <span className="text-red-300">Clear all chats?</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllChats();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-0.5 rounded bg-red-600 text-white font-medium cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-0.5 rounded hover:bg-white/10 text-[#ccc] cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#b4b4b4] hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Clear All Chats</span>
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => {
            onOpenLanding();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#b4b4b4] hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Overview &amp; Pricing</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#b4b4b4] hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenAuth();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-white/8 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#10a37f] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-semibold text-white truncate">{displayName}</div>
              <div className="text-[11px] text-[#8e8ea0] truncate">
                {user ? (user.isDemo ? 'Demo session' : user.email) : 'Sign in / Try Demo'}
              </div>
            </div>
          </div>
          {!user && <LogIn className="w-3.5 h-3.5 text-[#8e8ea0] shrink-0" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && <div className="hidden md:block h-full shrink-0">{sidebarContent}</div>}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
