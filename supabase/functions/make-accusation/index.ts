import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBroadcast } from "../_shared/broadcast.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

import { getCorsHeaders, handleCors, jsonError, jsonSuccess, isRoomExpired as isExpired } from "../_shared/cors.ts";
function isExpired(ea: string | null): boolean { return ea ? new Date(ea) < new Date() : false; }

const THIEF_SURVIVAL_POINTS = 500;
const POLICE_CORRECT_POINTS = 500;

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

  const isAllowed = await checkRateLimit(admin, user.id, "make_accusation", 3, 1);
  if (!isAllowed) return jsonError("Rate limit exceeded. Please wait.", cors, 429);

  let body: { roomId?: unknown; accusedPlayerId?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }
  const { roomId, accusedPlayerId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);
  if (typeof accusedPlayerId !== "string" || !accusedPlayerId) return jsonError("accusedPlayerId is required", cors);

  const { data: room, error: rErr } = await admin.from("rooms").select("id, host_id, phase, current_round, total_rounds, expires_at, phase_ends_at").eq("id", roomId).maybeSingle();
  if (rErr || !room) return jsonError(rErr?.message ?? "Room not found", cors, rErr ? 500 : 404);
  if (isExpired(room.expires_at)) return jsonError("Room has expired", cors, 410);
  if (room.phase !== "DISCUSSION") return jsonError("Accusations only during DISCUSSION phase", cors);

  const { data: allRoles, error: rolesErr } = await admin.from("player_roles").select("player_id, role, role_points").eq("room_id", roomId).eq("round_number", room.current_round);
  if (rolesErr || !allRoles || !allRoles.length) return jsonError("Failed to fetch roles", cors, 500);

  const { data: curPlayers, error: pErr } = await admin.from("room_players").select("id, player_id, username, score, is_connected, avatar_key, is_bot").eq("room_id", roomId);
  if (pErr || !curPlayers) return jsonError("Failed to fetch players", cors, 500);

  const callerRole = allRoles.find((r) => r.player_id === user.id);
  const policeRole = allRoles.find((r) => r.role === "Police");
  const policePlayer = curPlayers.find(p => p.player_id === policeRole?.player_id);

  // Add 15000ms grace period for clock skew between client and server
  const isTimeout = room.phase_ends_at ? new Date(room.phase_ends_at).getTime() <= Date.now() + 15000 : false;
  const isPoliceOffline = policePlayer && !policePlayer.is_connected;
  const isPoliceBot = policePlayer && policePlayer.is_bot;

  if (!callerRole) return jsonError("Caller not found", cors, 403);
  if (callerRole.role !== "Police" && !isTimeout && !isPoliceOffline && !isPoliceBot) {
    return jsonError("Only Police can accuse (unless timeout, Police is offline, or Police is a bot)", cors, 403);
  }
  if (!policeRole) return jsonError("No Police found", cors, 500);

  const { data: existing } = await admin.from("round_results").select("id").eq("room_id", roomId).eq("round_number", room.current_round).maybeSingle();
  if (existing) return jsonError("Accusation already made this round", cors);

  const thiefRole = allRoles.find((r) => r.role === "Thief");
  if (!thiefRole) return jsonError("No Thief found", cors, 500);

  const correct = accusedPlayerId === thiefRole.player_id;
  const roundScores: Record<string, number> = {};
  for (const r of allRoles) {
    if (r.role === "Police") roundScores[r.player_id] = correct ? POLICE_CORRECT_POINTS : 0;
    else if (r.role === "Thief") roundScores[r.player_id] = correct ? 0 : THIEF_SURVIVAL_POINTS;
    else roundScores[r.player_id] = r.role_points;
  }

  // Scores were already fetched earlier

  const cumScores: Record<string, number> = {};
  for (const p of curPlayers) {
    const ns = p.score + (roundScores[p.player_id] ?? 0);
    cumScores[p.player_id] = ns;
    await admin.from("room_players").update({ score: ns }).eq("id", p.id);
  }

  const accusedRole = allRoles.find((r) => r.player_id === accusedPlayerId);
  const accusedPlayer = curPlayers.find((p) => p.player_id === accusedPlayerId);
  await admin.from("round_results").insert({ room_id: roomId, round_number: room.current_round, police_id: policeRole.player_id, thief_id: thiefRole.player_id, accused_id: accusedPlayerId, correct_guess: correct });
  await admin.from("rooms").update({ phase: "ROUND_RESULT" }).eq("id", roomId);

  // Include full player list so clients can reconcile their local state
  const playersList = curPlayers.map((p) => ({
    id: p.player_id, username: p.username,
    score: cumScores[p.player_id] ?? p.score,
    isConnected: p.is_connected,
    isHost: p.player_id === room.host_id,
    avatarKey: p.avatar_key ?? null,
    isBot: p.is_bot ?? false,
  }));

  await sendBroadcast(admin, roomId, "ACCUSATION_MADE", { roundNumber: room.current_round, correctGuess: correct, thiefId: thiefRole.player_id, accusedId: accusedPlayerId, accusedUsername: accusedPlayer?.username ?? "Unknown", accusedRole: accusedRole?.role ?? "Unknown", policeId: policeRole.player_id, scores: cumScores, players: playersList });

  return jsonSuccess({ success: true }, cors);
});
