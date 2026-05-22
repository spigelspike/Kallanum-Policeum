import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const isAllowed = true;
  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

function generateRoomCode(): string {
  const values = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
}

function isValidUsername(username: unknown): username is string {
  if (typeof username !== "string") return false;
  const trimmed = username.trim();
  return trimmed.length > 0 && trimmed.length <= 20 && /^[a-zA-Z0-9 ]+$/.test(trimmed);
}

function isValidTotalRounds(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
}

const VALID_AVATAR_KEYS = ["male1", "male2", "male3", "female1", "female2", "female3"];
function isValidAvatarKey(value: unknown): value is string {
  return typeof value === "string" && VALID_AVATAR_KEYS.includes(value);
}

function jsonError(message: string, cors: Record<string, string>, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", cors, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonError("Missing Authorization header", cors, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const anonClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await anonClient.auth.getUser();

  if (authError || !user) {
    return jsonError("Invalid or expired token", cors, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
  });

  let body: { username?: unknown; totalRounds?: unknown; avatarKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", cors);
  }

  const { username: rawUsername, totalRounds, avatarKey: rawAvatarKey } = body;

  if (!isValidUsername(rawUsername)) {
    return jsonError("Username must be 1-20 characters, alphanumeric and spaces only", cors);
  }

  const username = (rawUsername as string).trim();

  if (!isValidTotalRounds(totalRounds)) {
    return jsonError("totalRounds must be an integer between 1 and 10", cors);
  }

  const avatarKey = isValidAvatarKey(rawAvatarKey) ? rawAvatarKey : null;

  // Rate limit
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count: recentCreations, error: rlError } = await admin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("player_id", user.id)
    .eq("action", "create_room")
    .gte("attempted_at", oneMinuteAgo);

  if (rlError) return jsonError("Rate limit check failed", cors, 500);
  if ((recentCreations ?? 0) >= 3) {
    return jsonError("Too many rooms created. Try again in a minute.", cors, 429);
  }

  await admin.from("rate_limits").insert({ player_id: user.id, action: "create_room" });

  // Generate unique code
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await admin.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }
  if (attempts >= 10) return jsonError("Failed to generate a unique room code.", cors, 500);

  // Cleanup expired rooms (garbage collection)
  await admin.from("rooms").delete().lt("expires_at", new Date().toISOString());

  // Create room
  const { data: room, error: roomError } = await admin
    .from("rooms")
    .insert({ code, host_id: user.id, phase: "WAITING", current_round: 1, total_rounds: totalRounds, max_players: 15 })
    .select("id, code")
    .single();

  if (roomError || !room) return jsonError(roomError?.message ?? "Failed to create room", cors, 500);

  // Add host
  const { data: player, error: playerError } = await admin
    .from("room_players")
    .insert({ room_id: room.id, player_id: user.id, username, avatar_key: avatarKey })
    .select("id")
    .single();

  if (playerError || !player) {
    await admin.from("rooms").delete().eq("id", room.id);
    return jsonError(playerError?.message ?? "Failed to add host", cors, 500);
  }

  return new Response(
    JSON.stringify({ roomCode: room.code, roomId: room.id, playerId: user.id }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
});
