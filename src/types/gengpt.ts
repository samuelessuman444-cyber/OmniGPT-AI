export type GenGPTModelId =
  | 'omnigpt-fast'
  | 'omnigpt-smart'
  | 'omnigpt-deep';

export type ToolMode =
  | 'auto'
  | 'search'
  | 'canvas'
  | 'visual'
  | 'video'
  | 'file'
  | 'music';

export type ToneOption = 'Professional' | 'Friendly' | 'Pidgin' | 'Funny';

export type LanguageOption =
  | 'English'
  | 'Pidgin'
  | 'Twi'
  | 'Yoruba'
  | 'Igbo'
  | 'Hausa'
  | 'French'
  | 'Spanish';

export interface UserSettings {
  name: string;
  theme: 'light' | 'dark';
  tone: ToneOption;
  language: LanguageOption;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  isDemo?: boolean;
}

export interface AttachmentItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  base64Data: string;
  previewUrl?: string;
  textContent?: string;
}

export interface FileArtifact {
  id: string;
  type: 'file';
  filename: string;
  mimeType: string;
  content: string;
  summary: string;
}

export interface VisualArtifact {
  id: string;
  type: 'visual';
  title: string;
  description: string;
  svgCode: string;
  width: number;
  height: number;
  aspectRatio?: string;
}

export interface VideoArtifact {
  id: string;
  type: 'video';
  title: string;
  description: string;
  width: number;
  height: number;
  durationSeconds: number;
  fps: number;
  renderScript: string;
  voiceoverAudioUrl?: string;
  voiceoverScript?: string;
}

export interface CanvasArtifact {
  id: string;
  type: 'canvas';
  title: string;
  language: string;
  code: string;
  description: string;
}

export interface SynthNote {
  note: string;
  time: number;
  duration: number;
  velocity?: number;
}

export interface SynthTrack {
  name: string;
  instrument: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'pad' | 'bass' | 'pluck' | 'perc';
  gain?: number;
  notes: SynthNote[];
}

export interface MusicArtifact {
  id: string;
  type: 'music';
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  keySignature: string;
  durationSeconds: number;
  tracks: SynthTrack[];
}

export interface AudioArtifact {
  id: string;
  type: 'audio';
  title: string;
  audioDataUrl: string;
  script?: string;
  voice?: string;
}

export type MessageArtifact =
  | FileArtifact
  | VisualArtifact
  | VideoArtifact
  | CanvasArtifact
  | MusicArtifact
  | AudioArtifact;

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  modelId?: GenGPTModelId;
  attachments?: AttachmentItem[];
  artifacts?: MessageArtifact[];
  sources?: GroundingSource[];
  isStreaming?: boolean;
  statusNote?: string;
  error?: string;
  feedback?: 'like' | 'dislike' | null;
}

export interface ChatThread {
  id: string;
  title: string;
  modelId: GenGPTModelId;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export const MODEL_OPTIONS: Array<{
  id: GenGPTModelId;
  name: string;
  badge: string;
  description: string;
}> = [
  {
    id: 'omnigpt-fast',
    name: 'OmniGPT Fast',
    badge: 'Fast',
    description: 'Ultra-fast responses for everyday chat, code, writing, and translations.',
  },
  {
    id: 'omnigpt-smart',
    name: 'OmniGPT Smart',
    badge: 'Smart',
    description: 'High-intelligence reasoning, multimodal tools & web search.',
  },
  {
    id: 'omnigpt-deep',
    name: 'OmniGPT Deep Think',
    badge: 'Deep',
    description: 'Maximum reasoning depth for math, science, architecture, and complex debugging.',
  },
];
