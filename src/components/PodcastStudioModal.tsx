import React, { useState } from 'react';
import { Loader2, Mic2, X } from 'lucide-react';
import type { AudioArtifact } from '../types/gengpt';

interface PodcastStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPodcastCreated: (title: string, script: string, artifact: AudioArtifact) => void;
}

const VOICES = ['Puck', 'Kore', 'Zephyr', 'Charon', 'Fenrir'];

export const PodcastStudioModal: React.FC<PodcastStudioModalProps> = ({
  isOpen,
  onClose,
  onPodcastCreated,
}) => {
  const [topic, setTopic] = useState('');
  const [hostA, setHostA] = useState('Alex');
  const [hostB, setHostB] = useState('Sam');
  const [voiceA, setVoiceA] = useState('Puck');
  const [voiceB, setVoiceB] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/podcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, hostA, hostB, voiceA, voiceB }),
      });
      const data = (await resp.json()) as {
        title?: string;
        script?: string;
        audioDataUrl?: string;
        error?: string;
      };
      if (!resp.ok || !data.audioDataUrl) {
        throw new Error(data.error || 'Failed to generate podcast.');
      }
      onPodcastCreated(data.title || 'GenGPT Podcast', data.script || '', {
        id: `pod_${Date.now()}`,
        type: 'audio',
        title: data.title || 'GenGPT Dual-Host Podcast',
        audioDataUrl: data.audioDataUrl,
        script: data.script,
        voice: `${hostA} (${voiceA}) & ${hostB} (${voiceB})`,
      });
      setTopic('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Podcast synthesis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#212121] border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <Mic2 className="w-5 h-5 text-[#10a37f]" />
            <h2 className="text-base font-semibold">Dual-Speaker Podcast Studio</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#555] dark:text-[#b4b4b4] mb-1.5">
              Topic, Article, or Debate Prompt
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="e.g., How quantum error correction is changing AI compute in 2026..."
              className="w-full rounded-xl px-3.5 py-2.5 text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#10a37f]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#555] dark:text-[#b4b4b4]">
                Host 1 Name &amp; Voice
              </label>
              <input
                type="text"
                value={hostA}
                onChange={(e) => setHostA(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none"
              />
              <select
                value={voiceA}
                onChange={(e) => setVoiceA(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#555] dark:text-[#b4b4b4]">
                Host 2 Name &amp; Voice
              </label>
              <input
                type="text"
                value={hostB}
                onChange={(e) => setHostB(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none"
              />
              <select
                value={voiceB}
                onChange={(e) => setVoiceB(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm bg-[#f7f7f8] dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="text-xs text-red-500">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#555] dark:text-[#b4b4b4] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#10a37f] text-white hover:bg-[#0e8f6f] disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Synthesizing Podcast...' : 'Generate Podcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
