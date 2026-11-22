import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type FunctionDeclaration,
  type Part,
} from '@google/genai';

export function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const createFileTool: FunctionDeclaration = {
  name: 'create_file',
  description:
    'Generate a complete, downloadable file (HTML, CSV, JSON, Markdown, Python, TypeScript, SQL, SVG, XML, TXT, etc.) for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      filename: {
        type: Type.STRING,
        description: 'Filename including extension, e.g. todo_app.html, budget.csv, report.md',
      },
      mimeType: {
        type: Type.STRING,
        description: 'MIME type such as text/html, text/csv, application/json, text/markdown',
      },
      content: {
        type: Type.STRING,
        description: 'Full raw text content of the file.',
      },
      summary: {
        type: Type.STRING,
        description: 'Brief 1-sentence description of what the file contains.',
      },
    },
    required: ['filename', 'mimeType', 'content', 'summary'],
  },
};

export const createVisualArtTool: FunctionDeclaration = {
  name: 'create_visual_art',
  description:
    'Generate high-fidelity, multi-layered SVG artwork, illustrations, posters, diagrams, or logos using rich SVG gradients, lighting filters, depth layers, and crisp geometry.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      svgCode: {
        type: Type.STRING,
        description:
          'Complete standalone <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">...</svg> markup without external links.',
      },
      width: { type: Type.NUMBER },
      height: { type: Type.NUMBER },
    },
    required: ['title', 'description', 'svgCode', 'width', 'height'],
  },
};

export const createVideoSceneTool: FunctionDeclaration = {
  name: 'create_video_scene',
  description:
    'Generate an animated motion-graphics video scene rendered on an HTML5 2D Canvas with optional AI voiceover narration, playable inline and exportable as .webm.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      width: { type: Type.NUMBER },
      height: { type: Type.NUMBER },
      durationSeconds: { type: Type.NUMBER },
      fps: { type: Type.NUMBER },
      renderScript: {
        type: Type.STRING,
        description:
          'Pure JS function body receiving (ctx, width, height, t, duration) drawing deterministic Canvas 2D frames.',
      },
      voiceoverText: { type: Type.STRING },
      voiceName: { type: Type.STRING },
    },
    required: ['title', 'description', 'width', 'height', 'durationSeconds', 'renderScript'],
  },
};

export const synthesizeVoiceTool: FunctionDeclaration = {
  name: 'synthesize_voice',
  description:
    'Synthesize realistic human speech audio (.wav) directly inside the chat using Gemini 3.8 TTS.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      text: { type: Type.STRING },
      voiceName: { type: Type.STRING },
      style: { type: Type.STRING },
    },
    required: ['title', 'text'],
  },
};

export const openLiveCanvasTool: FunctionDeclaration = {
  name: 'open_live_canvas',
  description:
    'Create a complete, self-contained interactive HTML5 web app, game, or UI prototype and launch it directly in the OmniGPT Live Interactive Canvas.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      language: { type: Type.STRING },
      code: { type: Type.STRING },
      description: { type: Type.STRING },
    },
    required: ['title', 'language', 'code', 'description'],
  },
};

export const composeAudioTrackTool: FunctionDeclaration = {
  name: 'compose_audio_track',
  description:
    'Compose an original playable polyphonic music track using structured multi-track Web Audio synthesizer notation (exportable as WAV).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      genre: { type: Type.STRING },
      mood: { type: Type.STRING },
      bpm: { type: Type.NUMBER },
      keySignature: { type: Type.STRING },
      durationSeconds: { type: Type.NUMBER },
      tracks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            instrument: { type: Type.STRING },
            gain: { type: Type.NUMBER },
            notes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING },
                  time: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER },
                  velocity: { type: Type.NUMBER },
                },
                required: ['note', 'time', 'duration'],
              },
            },
          },
          required: ['name', 'instrument', 'notes'],
        },
      },
    },
    required: ['title', 'genre', 'mood', 'bpm', 'keySignature', 'durationSeconds', 'tracks'],
  },
};

export interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{
    name: string;
    mimeType: string;
    base64Data: string;
    textContent?: string;
  }>;
}

export interface ChatRequestBody {
  messages?: IncomingMessage[];
  modelId?: string;
  toolMode?: string;
  tone?: string;
  language?: string;
  userName?: string;
}

export interface TtsRequestBody {
  text?: string;
  voiceName?: string;
  style?: string;
  mode?: 'single' | 'podcast';
  speakerA?: string;
  speakerB?: string;
  voiceA?: string;
  voiceB?: string;
  lines?: Array<{ speaker: string; style: string; text: string }>;
}

export interface PodcastRequestBody {
  topic?: string;
  hostA?: string;
  hostB?: string;
  voiceA?: string;
  voiceB?: string;
}

export interface TranscribeRequestBody {
  base64Audio?: string;
  mimeType?: string;
}

function resolveModelConfig(modelId: string) {
  switch (modelId) {
    case 'omnigpt-fast':
      return {
        model: 'gemini-3.1-flash-lite',
        thinkingLevel: undefined,
      };
    case 'omnigpt-deep':
      return {
        model: 'gemini-4-hydrogen',
        thinkingLevel: ThinkingLevel.HIGH,
      };
    case 'omnigpt-smart':
    default:
      return {
        model: 'gemini-4-hydrogen',
        thinkingLevel: ThinkingLevel.LOW,
      };
  }
}

function buildSystemInstruction(
  toolMode: string,
  tone = 'Friendly',
  language = 'English',
  userName = ''
): string {
  const toneGuide =
    tone === 'Pidgin'
      ? 'Respond naturally in crisp, expressive West African Pidgin English while keeping technical terms and code clear.'
      : tone === 'Funny'
        ? 'Keep answers clever, witty, and warm while staying accurate and genuinely helpful.'
        : tone === 'Professional'
          ? 'Maintain a polished, executive, concise, and authoritative tone.'
          : 'Maintain a warm, approachable, clear, and encouraging tone.';

  const langGuide =
    language && language !== 'English'
      ? `Write your primary conversational response in ${language} unless the user asks for another language.`
      : 'Always answer in simple, clear English unless the user requests translation into Pidgin, Twi, Yoruba, Igbo, Hausa, French, Spanish, or another language.';

  const modeHint =
    toolMode === 'canvas'
      ? 'The user enabled Live Canvas mode: when asked to build an app or HTML prototype, give full working code AND call `open_live_canvas`.'
      : toolMode === 'visual'
        ? 'The user enabled Image/Visual mode: generate rich, multi-layered SVG artwork via `create_visual_art`.'
        : toolMode === 'video'
          ? 'The user enabled Video mode: generate an animated Canvas motion video via `create_video_scene`.'
          : toolMode === 'file'
            ? 'The user enabled File Forge mode: generate a downloadable file via `create_file`.'
            : toolMode === 'music'
              ? 'The user enabled Music mode: compose a multi-track synth piece via `compose_audio_track`.'
              : toolMode === 'search'
                ? 'The user enabled Web Search mode: use Google Search grounding for up-to-date, cited facts.'
                : 'Use headings, bullets, and tables when helpful. If the user asks for code (like an HTML app, Python script, or JS), always include full working code inside fenced markdown code blocks (and optionally launch `open_live_canvas` for interactive web apps).';

  return [
    `You are OmniGPT, a super smart all-in-one AI assistant like ChatGPT.${userName ? ` You are assisting ${userName}.` : ''}`,
    'You can do anything: answer questions, write CVs/essays/business plans/emails/WhatsApp messages/songs/stories, solve school math step-by-step, quiz students, brainstorm business ideas (including local contexts like Ghana cedis), translate to Pidgin/Twi/Yoruba/Igbo/Hausa/French/Spanish, give life/workout/meal advice, and write complete working code.',
    toneGuide,
    langGuide,
    modeHint,
  ].join('\n');
}

function extractUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)>\]"']+/g) || [];
  return Array.from(new Set(matches)).slice(0, 10);
}

function buildConversationContents(messages: IncomingMessage[]) {
  return messages.map((m) => {
    const parts: Part[] = [];
    if (m.attachments && m.attachments.length > 0) {
      for (const att of m.attachments) {
        if (att.textContent) {
          parts.push({
            text: `[Attached file: ${att.name} (${att.mimeType})]\n\`\`\`\n${att.textContent.slice(0, 40000)}\n\`\`\``,
          });
        } else if (att.base64Data) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType || 'application/octet-stream',
              data: att.base64Data,
            },
          });
        }
      }
    }
    if (m.content) {
      parts.push({ text: m.content });
    } else if (parts.length === 0) {
      parts.push({ text: ' ' });
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });
}

async function generateTtsWavDataUrl(
  ai: GoogleGenAI,
  text: string,
  voiceName = 'Zephyr',
  style = 'Clear, natural, expressive voice'
): Promise<string | undefined> {
  const cleanText = text.trim().slice(0, 2500);
  if (!cleanText) return undefined;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: { style },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio ? `data:audio/wav;base64,${base64Audio}` : undefined;
  } catch (err) {
    console.error('Inline TTS synthesis warning:', err);
    return undefined;
  }
}

async function executeArtifactTool(
  ai: GoogleGenAI,
  name: string,
  args: Record<string, unknown>
) {
  const id = `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (name === 'create_file') {
    const filename = String(args.filename || 'omnigpt-output.txt');
    const mimeType = String(args.mimeType || 'text/plain');
    const content = String(args.content || '');
    const summary = String(args.summary || `Generated ${filename}`);
    return {
      artifact: { id, type: 'file', filename, mimeType, content, summary },
      toolOutput: { status: 'success', filename, bytes: content.length },
    };
  }

  if (name === 'create_visual_art') {
    const title = String(args.title || 'OmniGPT Artwork');
    const description = String(args.description || 'Generated vector illustration');
    const svgCode = String(
      args.svgCode || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"></svg>'
    );
    const width = Number(args.width || 1024);
    const height = Number(args.height || 1024);
    return {
      artifact: { id, type: 'visual', title, description, svgCode, width, height },
      toolOutput: { status: 'success', title, width, height },
    };
  }

  if (name === 'create_video_scene') {
    const title = String(args.title || 'OmniGPT Motion Video');
    const description = String(args.description || 'Animated canvas motion sequence');
    const width = Math.min(1920, Math.max(480, Number(args.width || 1280)));
    const height = Math.min(1080, Math.max(360, Number(args.height || 720)));
    const durationSeconds = Math.min(20, Math.max(3, Number(args.durationSeconds || 8)));
    const fps = Number(args.fps || 30);
    const renderScript = String(args.renderScript || '');
    const voiceoverText = args.voiceoverText ? String(args.voiceoverText) : '';
    const voiceName = args.voiceName ? String(args.voiceName) : 'Zephyr';

    let voiceoverAudioUrl: string | undefined;
    if (voiceoverText.trim()) {
      voiceoverAudioUrl = await generateTtsWavDataUrl(
        ai,
        voiceoverText,
        voiceName,
        'Warm cinematic narrator'
      );
    }

    return {
      artifact: {
        id,
        type: 'video',
        title,
        description,
        width,
        height,
        durationSeconds,
        fps,
        renderScript,
        voiceoverAudioUrl,
        voiceoverScript: voiceoverText || undefined,
      },
      toolOutput: {
        status: 'success',
        title,
        durationSeconds,
        hasVoiceover: Boolean(voiceoverAudioUrl),
      },
    };
  }

  if (name === 'synthesize_voice') {
    const title = String(args.title || 'OmniGPT Voice Clip');
    const text = String(args.text || '');
    const voiceName = String(args.voiceName || 'Zephyr');
    const style = String(args.style || 'Clear, natural, expressive voice');

    const audioDataUrl = await generateTtsWavDataUrl(ai, text, voiceName, style);
    if (!audioDataUrl) {
      return {
        artifact: null,
        toolOutput: { status: 'error', message: 'Voice synthesis failed.' },
      };
    }

    return {
      artifact: {
        id,
        type: 'audio',
        title,
        audioDataUrl,
        script: text,
        voice: voiceName,
      },
      toolOutput: { status: 'success', title, voiceName },
    };
  }

  if (name === 'open_live_canvas') {
    const title = String(args.title || 'Interactive App');
    const language = String(args.language || 'html');
    const code = String(args.code || '');
    const description = String(args.description || 'Live interactive canvas application');
    return {
      artifact: { id, type: 'canvas', title, language, code, description },
      toolOutput: { status: 'success', title, lines: code.split('\n').length },
    };
  }

  if (name === 'compose_audio_track') {
    const title = String(args.title || 'OmniGPT Synth Track');
    const genre = String(args.genre || 'Electronic');
    const mood = String(args.mood || 'Atmospheric');
    const bpm = Number(args.bpm || 110);
    const keySignature = String(args.keySignature || 'C Minor');
    const durationSeconds = Number(args.durationSeconds || 16);
    const tracks = Array.isArray(args.tracks) ? args.tracks : [];
    return {
      artifact: {
        id,
        type: 'music',
        title,
        genre,
        mood,
        bpm,
        keySignature,
        durationSeconds,
        tracks,
      },
      toolOutput: { status: 'success', title, trackCount: tracks.length, bpm },
    };
  }

  return {
    artifact: null,
    toolOutput: { status: 'error', message: `Unknown tool: ${name}` },
  };
}

export async function handleChatStream(
  body: ChatRequestBody,
  sendSSE: (event: string, data: unknown) => void,
  abortSignal: AbortSignal
) {
  try {
    const ai = getAI();
    const {
      messages = [],
      modelId = 'omnigpt-fast',
      toolMode = 'auto',
      tone = 'Friendly',
      language = 'English',
      userName = '',
    } = body;

    const { model, thinkingLevel } = resolveModelConfig(modelId);
    const systemInstruction = buildSystemInstruction(
      toolMode,
      tone,
      language,
      userName
    );
    const contents = buildConversationContents(messages);

    const lastUserText =
      [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const detectedUrls = extractUrlsFromText(lastUserText);

    const useSearch = toolMode === 'search';
    const lowerPrompt = lastUserText.toLowerCase();

    const tools: Array<Record<string, unknown>> = [];
    if (useSearch) {
      tools.push({ googleSearch: {} });
    }
    if (detectedUrls.length > 0 && model === 'gemini-4-hydrogen') {
      tools.push({ urlContext: {} });
    }
    if (toolMode === 'canvas') {
      tools.push({ functionDeclarations: [openLiveCanvasTool] });
    } else if (toolMode === 'visual') {
      tools.push({ functionDeclarations: [createVisualArtTool] });
    } else if (toolMode === 'video') {
      tools.push({ functionDeclarations: [createVideoSceneTool] });
    } else if (toolMode === 'file') {
      tools.push({ functionDeclarations: [createFileTool] });
    } else if (toolMode === 'music') {
      tools.push({ functionDeclarations: [composeAudioTrackTool] });
    } else if (
      toolMode === 'auto' &&
      model !== 'gemini-3.1-flash-lite' &&
      /\b(file|csv|json|markdown|download|svg|draw|diagram|illustration|logo|poster|image|artwork|video|animate|animation|voice|speak|narrate|audio|tts|music|song|beat|melody|compose|canvas|preview|interactive)\b/.test(
        lowerPrompt
      )
    ) {
      tools.push({
        functionDeclarations: [
          createFileTool,
          createVisualArtTool,
          createVideoSceneTool,
          synthesizeVoiceTool,
          openLiveCanvasTool,
          composeAudioTrackTool,
        ],
      });
    }

    const config: Record<string, unknown> = {
      systemInstruction,
    };

    if (thinkingLevel) {
      config.thinkingConfig = { thinkingLevel };
    }

    if (tools.length > 0) {
      config.tools = tools;
      const hasFn = tools.some((t) => 'functionDeclarations' in t);
      if (hasFn && (useSearch || detectedUrls.length > 0)) {
        config.toolConfig = { includeServerSideToolInvocations: true };
      }
    }

    sendSSE('status', { text: 'OmniGPT is typing...' });

    const isTransientError = (err: unknown) => {
      const name = err instanceof Error ? err.name : '';
      const msg = err instanceof Error ? err.message : String(err || '');
      const lower = msg.toLowerCase();
      return (
        name === 'AbortError' ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('500') ||
        msg.includes('INTERNAL') ||
        lower.includes('aborted') ||
        lower.includes('timeout') ||
        lower.includes('etimedout') ||
        lower.includes('econnreset') ||
        lower.includes('fetch failed')
      );
    };

    const primaryTimeoutMs = modelId === 'omnigpt-deep' ? 30000 : 15000;

    const callStreamWithRetry = async () => {
      const attempts: Array<{ m: string; cfg: Record<string, unknown>; delayMs: number }> = [
        {
          m: model,
          cfg: { ...config, httpOptions: { timeout: primaryTimeoutMs } },
          delayMs: 0,
        },
        {
          m: 'gemini-3.1-flash-lite',
          cfg: { systemInstruction, httpOptions: { timeout: 15000 } },
          delayMs: 250,
        },
      ];

      let lastErr: unknown;
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        if (abortSignal.aborted) return null;
        if (attempt.delayMs > 0) {
          sendSSE('status', { text: 'Retrying with backup model...' });
          await new Promise((r) => setTimeout(r, attempt.delayMs));
          if (abortSignal.aborted) return null;
        }
        try {
          const stream = await ai.models.generateContentStream({
            model: attempt.m,
            contents,
            config: attempt.cfg,
          });
          return { stream, activeModel: attempt.m, activeConfig: attempt.cfg };
        } catch (err: unknown) {
          lastErr = err;
          if (abortSignal.aborted) return null;
          const msg = err instanceof Error ? err.message : '';
          const hasTools = Boolean(attempt.cfg.tools);
          const isToolUnsupported =
            hasTools && (msg.includes('400') || msg.includes('INVALID_ARGUMENT'));
          if (!isTransientError(err) && !isToolUnsupported) {
            throw err;
          }
          console.log(
            `[OmniGPT] Switching to backup after attempt ${i + 1} (${attempt.m}):`,
            msg.slice(0, 120)
          );
        }
      }
      throw lastErr;
    };

    const firstTurn = await callStreamWithRetry();
    if (!firstTurn) return;

    const { stream: stream1, activeModel, activeConfig } = firstTurn;
    const collectedModelParts: Part[] = [];
    const collectedSources: Array<{ title: string; uri: string }> = [];
    const seenUris = new Set<string>();

    for await (const chunk of stream1) {
      if (abortSignal.aborted) break;

      const candidate = chunk.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];
      for (const p of parts) {
        collectedModelParts.push(p);
        if (p.text && !p.thought) {
          sendSSE('delta', { text: p.text });
        }
      }

      const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
      for (const gc of groundingChunks) {
        if (gc.web?.uri && !seenUris.has(gc.web.uri)) {
          seenUris.add(gc.web.uri);
          collectedSources.push({
            title: gc.web.title || gc.web.uri,
            uri: gc.web.uri,
          });
        }
      }
    }

    const functionCalls = collectedModelParts
      .map((p) => p.functionCall)
      .filter((fc): fc is NonNullable<Part['functionCall']> => Boolean(fc));

    if (functionCalls.length > 0 && !abortSignal.aborted) {
      const functionResponseParts: Part[] = [];

      for (const fc of functionCalls) {
        const fnName = fc.name || '';
        sendSSE('status', {
          text:
            fnName === 'open_live_canvas'
              ? 'Building Live Canvas app...'
              : fnName === 'create_visual_art'
                ? 'Rendering visual artwork...'
                : fnName === 'create_video_scene'
                  ? 'Generating motion video...'
                  : fnName === 'synthesize_voice'
                    ? 'Synthesizing voice...'
                    : fnName === 'create_file'
                      ? 'Preparing downloadable file...'
                      : fnName === 'compose_audio_track'
                        ? 'Composing audio track...'
                        : `Running ${fnName}...`,
        });

        const { artifact, toolOutput } = await executeArtifactTool(
          ai,
          fnName,
          (fc.args as Record<string, unknown>) || {}
        );

        if (artifact) {
          sendSSE('artifact', artifact);
        }

        functionResponseParts.push({
          functionResponse: {
            id: fc.id,
            name: fnName,
            response: toolOutput,
          },
        });
      }

      const turn2Contents = [
        ...contents,
        { role: 'model', parts: collectedModelParts },
        { role: 'user', parts: functionResponseParts },
      ];

      const stream2 = await ai.models.generateContentStream({
        model: activeModel,
        contents: turn2Contents,
        config: { ...activeConfig, httpOptions: { timeout: 30000 } },
      });

      for await (const chunk of stream2) {
        if (abortSignal.aborted) break;
        const candidate = chunk.candidates?.[0];
        for (const p of candidate?.content?.parts ?? []) {
          if (p.text && !p.thought) {
            sendSSE('delta', { text: p.text });
          }
        }
        const groundingChunks = candidate?.groundingMetadata?.groundingChunks ?? [];
        for (const gc of groundingChunks) {
          if (gc.web?.uri && !seenUris.has(gc.web.uri)) {
            seenUris.add(gc.web.uri);
            collectedSources.push({
              title: gc.web.title || gc.web.uri,
              uri: gc.web.uri,
            });
          }
        }
      }
    }

    if (collectedSources.length > 0) {
      sendSSE('sources', collectedSources);
    }

    if (!abortSignal.aborted) {
      sendSSE('done', {});
    }
  } catch (err: unknown) {
    if (abortSignal.aborted) return;
    const rawMsg =
      err instanceof Error ? err.message : 'An unexpected error occurred with OmniGPT.';
    const lowerMsg = rawMsg.toLowerCase();
    let friendly = rawMsg;
    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      friendly =
        'Gemini API quota or rate limit reached (429). Please wait a moment and retry, or check your API key quota.';
    } else if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
      friendly =
        'The AI model is experiencing temporary high demand (503). Please click Retry in a moment.';
    } else if (lowerMsg.includes('aborted') || lowerMsg.includes('timeout')) {
      friendly =
        'The AI request timed out while waiting for the model. Please retry or switch to OmniGPT Fast.';
    } else if (
      rawMsg.includes('403') ||
      rawMsg.includes('400') ||
      rawMsg.includes('API_KEY_INVALID') ||
      rawMsg.includes('PERMISSION_DENIED')
    ) {
      friendly =
        'Gemini API key permission or configuration issue. Please verify GEMINI_API_KEY in your environment variables.';
    }
    console.error('OmniGPT /api/chat error:', friendly);
    sendSSE('error', { message: friendly });
  }
}

export async function handleTts(
  body: TtsRequestBody
): Promise<{ status: number; payload: Record<string, unknown> }> {
  try {
    const ai = getAI();
    const {
      text,
      voiceName = 'Zephyr',
      style = 'Clear, natural, articulate assistant',
      mode = 'single',
      speakerA = 'Alex',
      speakerB = 'Sam',
      voiceA = 'Puck',
      voiceB = 'Kore',
      lines,
    } = body;

    if (mode === 'podcast' && Array.isArray(lines) && lines.length > 0) {
      const parts = lines.map((line) => ({
        text: `${line.speaker}: ${line.text}`,
        speechMetadata: {
          speaker: line.speaker,
          style: line.style || 'Conversational podcast host',
        },
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speakerA,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } },
                },
                {
                  speaker: speakerB,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } },
                },
              ],
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return { status: 502, payload: { error: 'No audio returned by Gemini TTS.' } };
      }
      return { status: 200, payload: { audioDataUrl: `data:audio/wav;base64,${base64Audio}` } };
    }

    const cleanText = (text || '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*_`>]/g, '')
      .trim()
      .slice(0, 3500);

    if (!cleanText) {
      return { status: 400, payload: { error: 'No speakable text provided.' } };
    }

    const audioDataUrl = await generateTtsWavDataUrl(ai, cleanText, voiceName, style);
    if (!audioDataUrl) {
      return { status: 502, payload: { error: 'No audio returned by Gemini TTS.' } };
    }

    return { status: 200, payload: { audioDataUrl } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'TTS generation failed.';
    console.error('OmniGPT /api/tts error:', err);
    return { status: 500, payload: { error: message } };
  }
}

export async function handlePodcast(
  body: PodcastRequestBody
): Promise<{ status: number; payload: Record<string, unknown> }> {
  try {
    const ai = getAI();
    const {
      topic,
      hostA = 'Alex',
      hostB = 'Sam',
      voiceA = 'Puck',
      voiceB = 'Kore',
    } = body;

    if (!topic?.trim()) {
      return { status: 400, payload: { error: 'Podcast topic is required.' } };
    }

    const scriptResp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Write an engaging, punchy 6-to-8 turn dual-speaker podcast dialogue between ${hostA} and ${hostB} about: "${topic}".
Include natural spoken cues sparingly such as <breath>, <laugh>, |yeah|, or |mhm| so it sounds alive and conversational. Keep total duration around 25-40 seconds.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            turns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING },
                  style: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['speaker', 'style', 'text'],
              },
            },
          },
          required: ['title', 'turns'],
        },
      },
    });

    const parsed = JSON.parse(scriptResp.text || '{}') as {
      title?: string;
      turns?: Array<{ speaker: string; style: string; text: string }>;
    };

    const turns = (parsed.turns || []).slice(0, 10).map((t, idx) => ({
      speaker: idx % 2 === 0 ? hostA : hostB,
      style: t.style || 'Natural conversational podcast host',
      text: t.text,
    }));

    if (turns.length === 0) {
      return { status: 502, payload: { error: 'Failed to generate podcast script.' } };
    }

    const parts = turns.map((line) => ({
      text: `${line.speaker}: ${line.text}`,
      speechMetadata: {
        speaker: line.speaker,
        style: line.style,
      },
    }));

    const ttsResp = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: hostA,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } },
              },
              {
                speaker: hostB,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } },
              },
            ],
          },
        },
      },
    });

    const base64Audio =
      ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return {
        status: 502,
        payload: { error: 'Podcast audio synthesis returned empty output.' },
      };
    }

    const scriptText = turns.map((t) => `**${t.speaker}:** ${t.text}`).join('\n\n');

    return {
      status: 200,
      payload: {
        title: parsed.title || `Podcast: ${topic.slice(0, 48)}`,
        script: scriptText,
        audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Podcast generation failed.';
    console.error('OmniGPT /api/podcast error:', err);
    return { status: 500, payload: { error: message } };
  }
}

export async function handleTranscribe(
  body: TranscribeRequestBody
): Promise<{ status: number; payload: Record<string, unknown> }> {
  try {
    const ai = getAI();
    const { base64Audio, mimeType = 'audio/webm' } = body;

    if (!base64Audio) {
      return { status: 400, payload: { error: 'Missing audio data.' } };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: 'Transcribe this audio accurately. Return only the spoken words.' },
        ],
      },
    });

    return { status: 200, payload: { text: (response.text || '').trim() } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed.';
    console.error('OmniGPT /api/transcribe error:', err);
    return { status: 500, payload: { error: message } };
  }
}
