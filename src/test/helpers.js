const STREAM_COMPLETE_MARKER = "[[STREAM_COMPLETE]]";
const encoder = new TextEncoder();

export function createStreamResponse(chunks, { status = 200 } = {}) {
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function createGatedStream({ beforeFirst, afterGate, gate }) {
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(beforeFirst));
      await gate;
      controller.enqueue(encoder.encode(afterGate));
      controller.enqueue(encoder.encode(STREAM_COMPLETE_MARKER));
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function createErrorResponse(status, message) {
  return new Response(
    message ? JSON.stringify({ error: message }) : null,
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export function createResolvableGate() {
  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });

  return { promise, release };
}