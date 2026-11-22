import React, { useState } from 'react';
import { Download, FileArchive, Moon, Sun, Trash2, X } from 'lucide-react';
import type {
  LanguageOption,
  ToneOption,
  UserSettings,
} from '../types/gengpt';
import { downloadProjectZip } from '../utils/exportHelpers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (next: UserSettings) => void;
  onExportChats: () => void;
  onDeleteAllData: () => void;
}

const TONES: ToneOption[] = ['Professional', 'Friendly', 'Pidgin', 'Funny'];
const LANGUAGES: LanguageOption[] = [
  'English',
  'Pidgin',
  'Twi',
  'Yoruba',
  'Igbo',
  'Hausa',
  'French',
  'Spanish',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportChats,
  onDeleteAllData,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);
    try {
      await downloadProjectZip();
    } catch (err) {
      console.error('Zip download error:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#212121] border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8 dark:border-white/10">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-[#5d5d67] dark:text-[#b4b4b4] mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) =>
                onUpdateSettings({ ...settings, name: e.target.value })
              }
              placeholder="Enter your name"
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#10a37f]"
            />
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Theme</div>
              <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6]">
                Switch main chat surface between Light and Dark
              </div>
            </div>
            <div className="flex items-center p-1 rounded-lg bg-black/6 dark:bg-white/8 text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white shadow-xs'
                    : 'text-[#6e6e80] dark:text-[#9a9aa6]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'bg-white dark:bg-[#2a2a2a] text-[#0d0d0d] dark:text-white shadow-xs'
                    : 'text-[#6e6e80] dark:text-[#9a9aa6]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-medium text-[#5d5d67] dark:text-[#b4b4b4] mb-1.5">
              Assistant Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, tone: t })}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    settings.tone === t
                      ? 'bg-[#10a37f]/12 border-[#10a37f] text-[#10a37f]'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/4 dark:hover:bg-white/6'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-[#5d5d67] dark:text-[#b4b4b4] mb-1.5">
              Preferred Language
            </label>
            <select
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  language: e.target.value as LanguageOption,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#10a37f]"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Data Controls */}
          <div className="pt-4 border-t border-black/8 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Download Source (.zip)</div>
                <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6]">
                  Download the Netlify-ready OmniGPT source code archive
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <FileArchive className="w-3.5 h-3.5" />
                {downloadingZip ? 'Preparing...' : 'Download .zip'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Export Chats</div>
                <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6]">
                  Download all saved conversations as JSON
                </div>
              </div>
              <button
                type="button"
                onClick={onExportChats}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-black/12 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Delete All Data</div>
                <div className="text-xs text-[#6e6e80] dark:text-[#9a9aa6]">
                  Clear all local chats, preferences, and session data
                </div>
              </div>
              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAllData();
                      setConfirmDelete(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-black/6 dark:hover:bg-white/8 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
