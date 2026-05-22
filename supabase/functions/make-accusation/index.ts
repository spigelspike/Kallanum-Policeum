import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const isAllowed = true;
  return { "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
}
function jsonError(msg: string, cors: Record<string, string>, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function jsonSuccess(data: Record<string, unknown>, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
}
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

  let body: { roomId?: unknown; accusedPlayerId?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }
  const { roomId, accusedPlayerId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);
  if (typeof accusedPlayerId !== "string" || !accusedPlayerId) return jsonError("accusedPlayerId is required", cors);

  const { data: room, error: rErr } = await admin.from("rooms").select("id, host_id, phase, current_round, total_rounds, expires_at").eq("id", roomId).maybeSingle();
  if (rErr || !room) return jsonError(rErr?.message ?? "Room not found", cors, rErr ? 500 : 404);
  if (isExpired(room.expires_at)) return jsonError("Room has expired", cors, 410);
  if (room.phase !== "DISCUSSION") return jsonError("Accusations only during DISCUSSION phase", cors);

  const { data: allRoles, error: rolesErr } = await admin.from("player_roles").select("player_id, role, role_points").eq("room_id", roomId).eq("round_number", room.current_round);
  if (rolesErr || !allRoles || !allRoles.length) return jsonError("Failed to fetch roles", cors, 500);

  const callerRole = allRoles.find((r) => r.player_id === user.id);
  if (!callerRole || callerRole.role !== "Police") return jsonError("Only Police can accuse", cors, 403);

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

  const { data: curPlayers, error: pErr } = await admin.from("room_players").select("id, player_id, score").eq("room_id", roomId);
  if (pErr || !curPlayers) return jsonError("Failed to fetch scores", cors, 500);

  const cumScores: Record<string, number> = {};
  for (const p of curPlayers) {
    const ns = p.score + (roundScores[p.player_id] ?? 0);
    cumScores[p.player_id] = ns;
    await admin.from("room_players").update({ score: ns }).eq("id", p.id);
  }

  const accusedRole = allRoles.find((r) => r.player_id === accusedPlayerId);
  await admin.from("round_results").insert({ room_id: roomId, round_number: room.current_round, police_id: user.id, thief_id: thiefRole.player_id, accused_id: accusedPlayerId, correct_guess: correct });
  await admin.from("rooms").update({ phase: "ROUND_RESULT" }).eq("id", roomId);

  const channel = admin.channel(`room:${roomId}`);
  channel.send({ type: "broadcast", event: "ACCUSATION_MADE", payload: { roundNumber: room.current_round, correctGuess: correct, thiefId: thiefRole.player_id, accusedId: accusedPlayerId, accusedUsername: "", accusedRole: accusedRole?.role ?? "Unknown", policeId: user.id, scores: cumScores } });
  await admin.removeChannel(channel);

  return jsonSuccess({ success: true }, cors);
});
