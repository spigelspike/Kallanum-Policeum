import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders, handleCors, jsonError, jsonSuccess } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const cors = getCorsHeaders(req);
  if (req.method !== "POST") return jsonError("Method not allowed", cors, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith('Bearer ')) return jsonError("Missing or invalid Authorization header", cors, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const anonClient = createClient(supabaseUrl, anonKey);

  const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) return jsonError("Unauthorized", cors, 401);

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
  });

  let body: { roomId?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }
  const { roomId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);

  // Security Check: Ensure caller is in the room
  const { data: membership, error: memError } = await admin.from("room_players").select("id").eq("room_id", roomId).eq("player_id", user.id).maybeSingle();
  if (memError || !membership) return jsonError("Forbidden: You are not in this room", cors, 403);

  const { data: room, error: roomError } = await admin.from("rooms").select("phase").eq("id", roomId).maybeSingle();
  if (roomError || !room) return jsonError(roomError?.message ?? "Room not found", cors, roomError ? 500 : 404);

  return jsonSuccess({ phase: room.phase }, cors);
});
