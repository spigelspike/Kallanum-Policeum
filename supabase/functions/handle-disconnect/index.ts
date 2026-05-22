import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || !origin;
  return { "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
}
function jsonError(msg: string, cors: Record<string, string>, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function jsonSuccess(data: Record<string, unknown>, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
}
function isExpired(ea: string | null): boolean { return ea ? new Date(ea) < new Date() : false; }

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

  let body: { roomId?: unknown; disconnectedPlayerId?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }
  const { roomId, disconnectedPlayerId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);
  if (typeof disconnectedPlayerId !== "string" || !disconnectedPlayerId) return jsonError("disconnectedPlayerId is required", cors);

  const { data: room, error: rErr } = await admin.from("rooms").select("id, host_id, phase, current_round, total_rounds, expires_at").eq("id", roomId).maybeSingle();
  if (rErr || !room) return jsonError("Room not found", cors, 404);
  if (isExpired(room.expires_at)) return jsonError("Room has expired", cors, 410);

  await admin.from("room_players").update({ is_connected: false }).eq("room_id", roomId).eq("player_id", disconnectedPlayerId);

  if (room.phase !== "DISCUSSION" && room.phase !== "POLICE_SELECTION") {
    return jsonSuccess({ success: true, action: "marked_disconnected" }, cors);
  }

  const { data: dcRole } = await admin.from("player_roles").select("role, role_points").eq("room_id", roomId).eq("player_id", disconnectedPlayerId).eq("round_number", room.current_round).maybeSingle();
  if (!dcRole) return jsonSuccess({ success: true, action: "marked_disconnected" }, cors);

  const channel = admin.channel(`room:${roomId}`);

  if (dcRole.role === "Police") {
    await admin.from("rooms").update({ phase: "ROUND_RESULT" }).eq("id", roomId);
    channel.send({ type: "broadcast", event: "ROUND_VOIDED", payload: { reason: "Police disconnected", disconnectedPlayerId } });
    await admin.removeChannel(channel);
    return jsonSuccess({ success: true, action: "round_voided" }, cors);
  }

  if (dcRole.role === "Thief") {
    const { data: existing } = await admin.from("round_results").select("id").eq("room_id", roomId).eq("round_number", room.current_round).maybeSingle();
    if (existing) return jsonSuccess({ success: true, action: "already_resolved" }, cors);

    const { data: allRoles } = await admin.from("player_roles").select("player_id, role, role_points").eq("room_id", roomId).eq("round_number", room.current_round);
    if (!allRoles) return jsonError("Failed to fetch roles", cors, 500);
    const policeRole = allRoles.find((r) => r.role === "Police");
    if (!policeRole) return jsonError("No Police found", cors, 500);

    const { data: curPlayers } = await admin.from("room_players").select("id, player_id, score").eq("room_id", roomId);
    if (!curPlayers) return jsonError("Failed to fetch players", cors, 500);

    const cumScores: Record<string, number> = {};
    for (const p of curPlayers) {
      const r = allRoles.find((x) => x.player_id === p.player_id);
      let earned = 0;
      if (r?.role === "Police") earned = POLICE_CORRECT_POINTS;
      else if (r?.role === "Thief") earned = 0;
      else earned = r?.role_points ?? 0;
      const ns = p.score + earned;
      cumScores[p.player_id] = ns;
      await admin.from("room_players").update({ score: ns }).eq("id", p.id);
    }

    await admin.from("round_results").insert({ room_id: roomId, round_number: room.current_round, police_id: policeRole.player_id, thief_id: disconnectedPlayerId, accused_id: disconnectedPlayerId, correct_guess: true });
    await admin.from("rooms").update({ phase: "ROUND_RESULT" }).eq("id", roomId);

    channel.send({ type: "broadcast", event: "ACCUSATION_MADE", payload: { roundNumber: room.current_round, correctGuess: true, thiefId: disconnectedPlayerId, accusedId: disconnectedPlayerId, accusedRole: "Thief", policeId: policeRole.player_id, scores: cumScores, reason: "Thief disconnected" } });
    await admin.removeChannel(channel);
    return jsonSuccess({ success: true, action: "thief_auto_caught" }, cors);
  }

  await admin.removeChannel(channel);
  return jsonSuccess({ success: true, action: "game_continues" }, cors);
});
