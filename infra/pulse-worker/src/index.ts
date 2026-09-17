/**
 * Alejo Pulse Worker — proxy server-side a Pusher Channels.
 *
 * POST /pulse/event
 *   Headers: Authorization: Bearer <PULSE_API_KEY>  |  X-Api-Key: <PULSE_API_KEY>
 *   Body: { "channel": "sale-updates", "event": "sale:created", "data": { ... } }
 *
 * GET /health → { ok: true }
 *
 * Secrets: PULSE_API_KEY, PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER
 * Vars: ALLOWED_ORIGINS (csv)
 */

import {
  authorizePulse,
  buildPusherTriggerRequest,
  corsHeaders,
} from "./pusher-sign.js";

export interface Env {
  PULSE_API_KEY: string;
  PUSHER_APP_ID: string;
  PUSHER_KEY: string;
  PUSHER_SECRET: string;
  PUSHER_CLUSTER?: string;
  ALLOWED_ORIGINS?: string;
}

function json(data: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS || "");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
      return json(
        {
          ok: true,
          service: "alejo-pulse",
          ts: new Date().toISOString(),
        },
        200,
        cors,
      );
    }

    if (request.method === "POST" && url.pathname === "/pulse/event") {
      if (!authorizePulse(request, env.PULSE_API_KEY)) {
        return json({ ok: false, error: "unauthorized" }, 401, cors);
      }

      if (!env.PUSHER_APP_ID || !env.PUSHER_KEY || !env.PUSHER_SECRET) {
        return json({ ok: false, error: "pusher_not_configured" }, 503, cors);
      }

      let payload: { channel?: string; event?: string; data?: unknown };
      try {
        payload = (await request.json()) as typeof payload;
      } catch {
        return json({ ok: false, error: "invalid_json" }, 400, cors);
      }

      const channel = String(payload.channel || "").trim();
      const event = String(payload.event || "").trim();
      if (!channel || !event) {
        return json({ ok: false, error: "channel_and_event_required" }, 400, cors);
      }

      // Basic channel allow-list (public channels only)
      const allowedPrefixes = [
        "sale-",
        "stock-",
        "support-",
        "promotions-",
        "notifications-",
        "ia-",
      ];
      const okChannel =
        allowedPrefixes.some((p) => channel.startsWith(p)) ||
        channel === "sale-updates" ||
        channel === "stock-updates";
      if (!okChannel && !channel.startsWith("sale-verification-")) {
        return json({ ok: false, error: "channel_not_allowed" }, 403, cors);
      }

      try {
        const { url: pusherUrl, body } = await buildPusherTriggerRequest({
          appId: env.PUSHER_APP_ID,
          key: env.PUSHER_KEY,
          secret: env.PUSHER_SECRET,
          cluster: env.PUSHER_CLUSTER || "mt1",
          channel,
          event,
          data: payload.data ?? {},
        });

        const res = await fetch(pusherUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return json(
            {
              ok: false,
              error: "pusher_upstream",
              status: res.status,
              detail: text.slice(0, 300),
            },
            502,
            cors,
          );
        }

        return json({ ok: true, via: "pusher-rest", channel, event }, 200, cors);
      } catch (e) {
        return json(
          {
            ok: false,
            error: "pusher_network",
            detail: e instanceof Error ? e.message : String(e),
          },
          502,
          cors,
        );
      }
    }

    return json({ ok: false, error: "not_found" }, 404, cors);
  },
};
