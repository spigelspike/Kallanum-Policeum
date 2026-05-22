// Shared CORS and utility functions for all Edge Functions

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  // Add your production Vercel domain here:
  // "https://kallanumpoliceum.vercel.app",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function checkOrigin(req: Request): Response | null {
  const origin = req.headers.get("Origin") ?? "";
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export function jsonError(
  message: string,
  headers: Record<string, string>,
  status = 400
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export function jsonSuccess(
  data: Record<string, unknown>,
  headers: Record<string, string>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

/** Reject if room.expires_at has passed */
export function isRoomExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
