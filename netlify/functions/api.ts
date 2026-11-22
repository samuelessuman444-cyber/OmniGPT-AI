import {
  handleChatStream,
  handlePodcast,
  handleTranscribe,
  handleTts,
  type ChatRequestBody,
  type PodcastRequestBody,
  type TranscribeRequestBody,
  type TtsRequestBody,
} from '../../server/geminiHandler';

function getRoutePath(urlStr: string): string {
  const pathname = new URL(urlStr).pathname;
  return pathname
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '') || '/';
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const route = getRoutePath(req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (route === '/health' && req.method === 'GET') {
    return jsonResponse({ ok: true, service: 'OmniGPT', runtime: 'netlify' });
  }

  if (route === '/chat' && req.method === 'POST') {
    let body: ChatRequestBody = {};
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
    }

    const encoder = new TextEncoder();
    const abortController = new AbortController();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendSSE = (event: string, data: unknown) => {
          if (abortController.signal.aborted) return;
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            abortController.abort();
          }
        };

        try {
          await handleChatStream(body, sendSSE, abortController.signal);
        } finally {
          try {
            controller.close();
          } catch {
            // stream already closed
          }
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  if (route === '/tts' && req.method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as TtsRequestBody;
    const result = await handleTts(body);
    return jsonResponse(result.payload, result.status);
  }

  if (route === '/podcast' && req.method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as PodcastRequestBody;
    const result = await handlePodcast(body);
    return jsonResponse(result.payload, result.status);
  }

  if (route === '/transcribe' && req.method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as TranscribeRequestBody;
    const result = await handleTranscribe(body);
    return jsonResponse(result.payload, result.status);
  }

  return jsonResponse({ error: `Not found: ${route}` }, 404);
}
