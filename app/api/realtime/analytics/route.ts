import { NextResponse } from "next/server";

// Server-Sent Events endpoint for real-time analytics
export async function GET() {
  // TODO: Verify admin auth

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection event
      const send = (data: Record<string, unknown>) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      send({
        type: "connected",
        ts: Date.now(),
      });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        send({
          type: "heartbeat",
          ts: Date.now(),
        });
      }, 30000);

      // Mock analytics events (in production, subscribe to Redis pub/sub)
      const analyticsInterval = setInterval(() => {
        send({
          type: "analytics",
          data: {
            activeUsers: Math.floor(Math.random() * 100),
            newSignups: Math.floor(Math.random() * 10),
            activeTips: Math.floor(Math.random() * 50),
            revenue: Math.floor(Math.random() * 1000),
          },
          ts: Date.now(),
        });
      }, 5000);

      // Cleanup on close
      return () => {
        clearInterval(heartbeat);
        clearInterval(analyticsInterval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
