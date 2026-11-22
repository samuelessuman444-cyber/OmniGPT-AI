import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import JSZip from 'jszip';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  GoogleGenAI,
  Modality,
  ThinkingLevel,
  type LiveServerMessage,
} from '@google/genai';
import {
  getAI,
  handleChatStream,
  handlePodcast,
  handleTranscribe,
  handleTts,
  type ChatRequestBody,
  type PodcastRequestBody,
  type TranscribeRequestBody,
  type TtsRequestBody,
} from './server/geminiHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function sendSSE(res: express.Response, event: string, data: unknown) {
  if (!res.writableEnded) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '40mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'OmniGPT' });
  });

  // Download full Netlify-ready OmniGPT source codebase as a clean .zip archive
  app.get('/api/download-zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      const ignoredDirs = new Set([
        'node_modules',
        'dist',
        '.git',
        '.aistudio',
        '.cache',
        '.netlify',
      ]);
      const ignoredFiles = new Set([
        '.env',
        '.env.local',
        '.env.production',
        '.DS_Store',
        'Thumbs.db',
      ]);

      const walkAndAdd = async (dir: string) => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
              await walkAndAdd(fullPath);
            }
          } else if (entry.isFile()) {
            if (ignoredFiles.has(entry.name) || entry.name.endsWith('.zip')) {
              continue;
            }
            const relPath = path.relative(__dirname, fullPath).split(path.sep).join('/');
            const content = await fs.promises.readFile(fullPath);
            zip.file(relPath, content);
          }
        }
      };

      await walkAndAdd(__dirname);

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="omnigpt-source.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.setHeader('Cache-Control', 'no-store');
      res.send(zipBuffer);
    } catch (err) {
      console.error('[OmniGPT] /api/download-zip error:', err);
      res.status(500).json({ error: 'Failed to generate zip archive.' });
    }
  });

  // Main streaming Chat + Autonomous Multimodal Tools + Search Grounding endpoint
  app.post('/api/chat', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const abortController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    await handleChatStream(
      (req.body || {}) as ChatRequestBody,
      (event, data) => sendSSE(res, event, data),
      abortController.signal
    );

    if (!res.writableEnded) {
      res.end();
    }
  });

  // Text-to-Speech (Single speaker or Dual-Speaker Podcast via Gemini 3.8 TTS)
  app.post('/api/tts', async (req, res) => {
    const result = await handleTts((req.body || {}) as TtsRequestBody);
    res.status(result.status).json(result.payload);
  });

  // Generate 2-speaker Podcast Script + Audio
  app.post('/api/podcast', async (req, res) => {
    const result = await handlePodcast((req.body || {}) as PodcastRequestBody);
    res.status(result.status).json(result.payload);
  });

  // Audio Transcription via gemini-3.5-transcribe
  app.post('/api/transcribe', async (req, res) => {
    const result = await handleTranscribe((req.body || {}) as TranscribeRequestBody);
    res.status(result.status).json(result.payload);
  });

  // Vite Dev Middleware or Static Production Serve
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // WebSocket Server for Real-Time Live Voice, Vision & Speech Translation (/live)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', 'http://localhost');
    if (url.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || '/live', 'http://localhost');
    const mode = url.searchParams.get('mode') || 'assistant';
    const voiceName = url.searchParams.get('voice') || 'Zephyr';
    const targetLanguageCode = url.searchParams.get('targetLang') || 'es';

    let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;

    try {
      const ai = getAI();

      const liveModel =
        mode === 'translate'
          ? 'gemini-3.5-live-translate-preview'
          : mode === 'thinking'
            ? 'gemini-3.8-live-extended-thinking'
            : 'gemini-3.8-live';

      const liveConfig: Record<string, unknown> = {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };

      if (mode === 'translate') {
        liveConfig.translationConfig = {
          targetLanguageCode,
          echoTargetLanguage: false,
        };
      } else {
        liveConfig.speechConfig = {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        };
        liveConfig.systemInstruction =
          'You are OmniGPT in real-time voice mode. Respond naturally, concisely, and helpfully. If the user shares camera frames, describe and reason about what you see accurately.';
        if (mode === 'thinking') {
          liveConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MEDIUM };
        }
      }

      session = await ai.live.connect({
        model: liveModel,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready', mode, model: liveModel }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'inputTranscript',
                  text: content.inputTranscription.text,
                })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'outputTranscript',
                  text: content.outputTranscription.text,
                })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data,
                  })
                );
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              const msg = err instanceof Error ? err.message : 'Live session error';
              clientWs.send(JSON.stringify({ type: 'error', message: msg }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize Live session.';
      console.error('OmniGPT Live WS error:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message: msg }));
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          audio?: string;
          video?: string;
          text?: string;
        };
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.video) {
          session.sendRealtimeInput({
            video: { data: msg.video, mimeType: 'image/jpeg' },
          });
        } else if (msg.text) {
          session.sendRealtimeInput({ text: msg.text });
        }
      } catch (e) {
        console.error('Invalid WS client frame:', e);
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch {
        // ignore close errors
      }
      session = null;
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OmniGPT server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start OmniGPT server:', err);
  process.exit(1);
});
