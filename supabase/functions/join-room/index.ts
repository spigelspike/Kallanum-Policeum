import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBroadcast } from "../_shared/broadcast.ts";

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const isAllowed = true;
  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonError(msg: string, cors: Record<string, string>, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function isValidUsername(u: unknown): u is string {
  if (typeof u !== "string") return false;
  const t = u.trim();
  return t.length > 0 && t.length <= 20 && /^[a-zA-Z0-9 ]+$/.test(t);
}

const VALID_AVATAR_KEYS = ["male1", "male2", "male3", "female1", "female2", "female3"];
function isValidAvatarKey(value: unknown): value is string {
  return typeof value === "string" && VALID_AVATAR_KEYS.includes(value);
}

function isValidRoomCode(c: unknown): c is string {
  return typeof c === "string" && /^[A-Z0-9]{6}$/.test(c.toUpperCase());
}

function isExpired(expiresAt: string | null): boolean {
  return expiresAt ? new Date(expiresAt) < new Date() : false;
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return jsonError("Method not allowed", cors, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Missing Authorization header", cors, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) return jsonError("Invalid or expired token", cors, 401);

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
  });

  let body: { roomCode?: unknown; username?: unknown; avatarKey?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }

  const { roomCode: rawCode, username: rawUsername, avatarKey: rawAvatarKey } = body;
  if (!isValidUsername(rawUsername)) return jsonError("Username must be 1-20 chars, alphanumeric and spaces only", cors);
  const username = (rawUsername as string).trim();
  if (!isValidRoomCode(rawCode)) return jsonError("Room code must be exactly 6 alphanumeric characters", cors);
  const roomCode = (rawCode as string).toUpperCase();
  const avatarKey = isValidAvatarKey(rawAvatarKey) ? rawAvatarKey : null;

  // Rate limit
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: rlErr } = await admin.from("rate_limits").select("*", { count: "exact", head: true }).eq("player_id", user.id).eq("action", "join_room").gte("attempted_at", oneMinuteAgo);
  if (rlErr) return jsonError("Rate limit check failed", cors, 500);
  if ((count ?? 0) >= 10) return jsonError("Too many join attempts.", cors, 429);
  await admin.from("rate_limits").insert({ player_id: user.id, action: "join_room" });

  const { data: room, error: roomError } = await admin.from("rooms").select("id, code, phase, max_players, host_id, current_round, total_rounds, expires_at").eq("code", roomCode).maybeSingle();
  if (roomError) return jsonError("Failed to look up room", cors, 500);
  if (!room) return jsonError("Room not found.", cors, 404);
  if (isExpired(room.expires_at)) return jsonError("This room has expired", cors, 410);
  if (room.phase !== "WAITING") return jsonError("This room has already started.", cors);

  const { data: existingPlayers, error: pErr } = await admin.from("room_players").select("id, player_id, username, score, is_connected, avatar_key").eq("room_id", room.id);
  if (pErr) return jsonError("Failed to check room players", cors, 500);
  if ((existingPlayers?.length ?? 0) >= room.max_players) return jsonError("Room is full", cors);
  if (existingPlayers?.some((p) => p.player_id === user.id)) return jsonError("You are already in this room", cors);

  const { data: newPlayer, error: insertErr } = await admin.from("room_players").insert({ room_id: room.id, player_id: user.id, username, avatar_key: avatarKey }).select("id, player_id, username, score, is_connected, avatar_key").single();
  if (insertErr || !newPlayer) return jsonError(insertErr?.message ?? "Failed to join room", cors, 500);

  const allPlayers = [...(existingPlayers ?? []), newPlayer].map((p) => ({
    id: p.player_id, username: p.username, score: p.score, isConnected: p.is_connected, isHost: p.player_id === room.host_id, avatarKey: p.avatar_key ?? null,
  }));

  // Broadcast to existing players
  await sendBroadcast(admin, room.id, "PLAYER_JOINED", { id: user.id, username, score: 0, isConnected: true, isHost: false, avatarKey });

  return new Response(JSON.stringify({ roomId: room.id, roomCode: room.code, players: allPlayers }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
});
