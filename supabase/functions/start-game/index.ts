import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBroadcast } from "../_shared/broadcast.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

import { getCorsHeaders, handleCors, jsonError, jsonSuccess, isRoomExpired as isExpired } from "../_shared/cors.ts";
function isExpired(expiresAt: string | null): boolean {
  return expiresAt ? new Date(expiresAt) < new Date() : false;
}

const ROLE_POOL = [
  { name: "King", points: 1000 }, { name: "Queen", points: 800 },
  { name: "Minister", points: 700 }, { name: "General", points: 600 },
  { name: "Judge", points: 500 }, { name: "Doctor", points: 450 },
  { name: "Engineer", points: 400 }, { name: "Teacher", points: 350 },
  { name: "Merchant", points: 300 }, { name: "Farmer", points: 250 },
  { name: "Carpenter", points: 200 }, { name: "Guard", points: 180 },
  { name: "Servant", points: 150 },
];

function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  const randomBytes = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomBytes);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomBytes[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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

  const isAllowed = await checkRateLimit(admin, user.id, "start_game", 3, 1);
  if (!isAllowed) return jsonError("Rate limit exceeded. Please wait.", cors, 429);

  let body: { roomId?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }
  const { roomId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);

  const { data: room, error: roomError } = await admin.from("rooms").select("id, code, host_id, phase, current_round, total_rounds, expires_at").eq("id", roomId).maybeSingle();
  if (roomError || !room) return jsonError(roomError?.message ?? "Room not found", cors, roomError ? 500 : 404);
  if (isExpired(room.expires_at)) return jsonError("Room has expired", cors, 410);
  if (room.host_id !== user.id) return jsonError("Only the host can start the game", cors, 403);
  if (room.phase !== "WAITING") return jsonError("Game has already started", cors);

  const { data: players, error: pErr } = await admin.from("room_players").select("id, player_id, username").eq("room_id", roomId);
  if (pErr || !players) return jsonError("Failed to fetch players", cors, 500);
  if (players.length < 3) return jsonError(`Need at least 3 players. Currently: ${players.length}`, cors);
  if (players.length > 15) return jsonError(`Maximum 15 players. Currently: ${players.length}`, cors);

  const fillerCount = players.length - 2;
  const fullRoleList = [
    { name: "Police", points: 0 }, { name: "Thief", points: 0 },
    ...ROLE_POOL.slice(0, fillerCount).map((r) => ({ name: r.name, points: r.points })),
  ];
  const shuffledRoles = fisherYatesShuffle(fullRoleList);

  // Clear any existing roles for this round in case of a previous failed attempt
  await admin.from("player_roles").delete().eq("room_id", roomId).eq("round_number", room.current_round);

  let policePlayerId: string | null = null;
  for (let i = 0; i < players.length; i++) {
    const { error: insErr } = await admin.from("player_roles").insert({
      room_id: roomId, player_id: players[i].player_id,
      round_number: room.current_round, role: shuffledRoles[i].name, role_points: shuffledRoles[i].points,
    });
    if (insErr) {
      await admin.from("player_roles").delete().eq("room_id", roomId).eq("round_number", room.current_round);
      return jsonError(`Failed to assign role: ${insErr.message}`, cors, 500);
    }
    if (shuffledRoles[i].name === "Police") policePlayerId = players[i].player_id;
  }

  if (!policePlayerId) return jsonError("Critical: no Police assigned", cors, 500);

  // Set phase to DISCUSSION and start the 60-second timer
  const phaseEndsAt = new Date(Date.now() + 60000).toISOString();
  const { error: updErr } = await admin.from("rooms").update({ 
    phase: "DISCUSSION"
  }).eq("id", roomId);
  
  if (updErr) {
    return jsonError(`Failed to update room phase: ${updErr.message}`, cors, 500);
  }

  await sendBroadcast(admin, roomId, "GAME_STARTED", { policeId: policePlayerId, phase: "DISCUSSION", phaseEndsAt });

  return jsonSuccess({ success: true, policeId: policePlayerId }, cors);
});
