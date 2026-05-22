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

  let body: { roomId?: unknown; disconnectedHostId?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }
  const { roomId, disconnectedHostId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);
  if (typeof disconnectedHostId !== "string" || !disconnectedHostId) return jsonError("disconnectedHostId is required", cors);

  const { data: room, error: rErr } = await admin.from("rooms").select("id, host_id, phase, expires_at").eq("id", roomId).maybeSingle();
  if (rErr || !room) return jsonError("Room not found", cors, 404);
  if (isExpired(room.expires_at)) return jsonError("Room has expired", cors, 410);
  if (room.host_id !== disconnectedHostId) return jsonError("Not the current host", cors);

  const { data: players } = await admin.from("room_players").select("player_id, username, is_connected").eq("room_id", roomId).neq("player_id", disconnectedHostId).eq("is_connected", true).order("joined_at", { ascending: true }).limit(1);

  if (!players || !players.length) return jsonSuccess({ success: true, abandoned: true, newHostId: null }, cors);

  const newHost = players[0];
  await admin.from("rooms").update({ host_id: newHost.player_id }).eq("id", roomId);
  await admin.from("room_players").update({ is_connected: false }).eq("room_id", roomId).eq("player_id", disconnectedHostId);

  const ch = admin.channel(`room:${roomId}`);
  ch.send({ type: "broadcast", event: "HOST_TRANSFERRED", payload: { newHostId: newHost.player_id, newHostUsername: newHost.username, reason: "Previous host disconnected" } });
  await admin.removeChannel(ch);

  return jsonSuccess({ success: true, abandoned: false, newHostId: newHost.player_id }, cors);
});
