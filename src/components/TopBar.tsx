import React, { useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  Check,
  ChevronDown,
  Menu,
  PanelLeftOpen,
  PanelRightOpen,
  Share2,
  SquarePen,
} from 'lucide-react';
import { MODEL_OPTIONS, type GenGPTModelId } from '../types/gengpt';
import { GenGPTIcon } from './GenGPTIcon';

interface TopBarProps {
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  selectedModel: GenGPTModelId;
  onSelectModel: (id: GenGPTModelId) => void;
  onOpenLiveVoice: () => void;
  hasCanvas: boolean;
  canvasOpen: boolean;
  onToggleCanvas: () => void;
  canShareChat: boolean;
  onShareChat: () => Promise<void>;
}

export const TopBar: React.FC<TopBarProps> = ({
  sidebarOpen,
  onOpenSidebar,
  onNewChat,
  selectedModel,
  onSelectModel,
  onOpenLiveVoice,
  hasCanvas,
  canvasOpen,
  onToggleCanvas,
  canShareChat,
  onShareChat,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const current = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleShare = async () => {
    await onShareChat();
    setShared(true);
    setTimeout(() => setShared(false), 1800);
  };

  return (
    <header className="h-14 px-3 sm:px-4 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#212121] border-b border-black/6 dark:border-white/6 z-20">
      {/* Left: Hamburger (mobile) / Sidebar Expand + OmniGPT Model Dropdown */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className={`p-2 rounded-lg text-[#5d5d67] dark:text-[#b4b4b4] hover:bg-black/6 dark:hover:bg-white/8 transition-colors cursor-pointer shrink-0 ${
            sidebarOpen ? 'md:hidden' : ''
          }`}
          title="Open sidebar"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 md:hidden" />
          <PanelLeftOpen className="w-5 h-5 hidden md:block" />
        </button>

        {!sidebarOpen && (
          <button
            type="button"
            onClick={onNewChat}
            className="hidden md:inline-flex p-2 rounded-lg text-[#5d5d67] dark:text-[#b4b4b4] hover:bg-black/6 dark:hover:bg-white/8 transition-colors cursor-pointer shrink-0"
            title="New Chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer whitespace-nowrap"
          >
            <GenGPTIcon size={20} className="text-[#0d0d0d] dark:text-white shrink-0" />
            <span className="text-base font-semibold tracking-tight text-[#0d0d0d] dark:text-[#ececec]">
              {current.name}
            </span>
            <ChevronDown className="w-4 h-4 text-[#8e8ea0]" />
          </button>

          {menuOpen && (
            <div className="absolute left-0 mt-1.5 w-80 rounded-2xl bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/12 shadow-xl p-1.5 z-30">
              {MODEL_OPTIONS.map((opt) => {
                const active = opt.id === selectedModel;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(opt.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#0d0d0d] dark:text-[#ececec]">
                          {opt.name}
                        </span>
                        <span className="text-[11px] text-[#6e6e80] dark:text-[#9a9aa6]">
                          · {opt.badge}
                        </span>
                      </div>
                      <div className="text-xs text-[#6e6e80] dark:text-[#b4b4b4] mt-0.5 leading-snug">
                        {opt.description}
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#10a37f] shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {hasCanvas && (
          <button
            type="button"
            onClick={onToggleCanvas}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              canvasOpen
                ? 'bg-[#10a37f]/12 border-[#10a37f]/40 text-[#10a37f]'
                : 'border-black/12 dark:border-white/12 text-[#37373d] dark:text-[#d4d4d8] hover:bg-black/5 dark:hover:bg-white/8'
            }`}
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{canvasOpen ? 'Hide Canvas' : 'Canvas'}</span>
          </button>
        )}

        {canShareChat && (
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-black/12 dark:border-white/12 text-[#37373d] dark:text-[#d4d4d8] hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer whitespace-nowrap"
          >
            {shared ? (
              <Check className="w-3.5 h-3.5 text-[#10a37f]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>{shared ? 'Copied' : 'Share'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenLiveVoice}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <AudioLines className="w-3.5 h-3.5" />
          <span>Voice</span>
        </button>
      </div>
    </header>
  );
};
