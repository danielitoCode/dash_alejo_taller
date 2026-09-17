/** Ambient types for pusher-sign.js (implementation is pure JS for Worker + Node tests). */
export function md5Hex(message: string): string;
export function hexFromBuffer(buf: ArrayBuffer): string;
export function hmacSha256Hex(secret: string, data: string): Promise<string>;
export function buildPusherTriggerRequest(opts: {
  appId: string;
  key: string;
  secret: string;
  cluster?: string;
  channel: string;
  event: string;
  data?: unknown;
  timestampSec?: number;
}): Promise<{ url: string; body: string; bodyMd5: string; path: string; query: string }>;
export function authorizePulse(request: Request, apiKey: string | undefined): boolean;
export function corsHeaders(
  origin: string,
  allowedOriginsCsv: string,
): Record<string, string>;
