import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBroadcast } from "../_shared/broadcast.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

import { getCorsHeaders, handleCors, jsonError, jsonSuccess } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const cors = getCorsHeaders(req);

  if (req.method !== "POST") return jsonError("Method not allowed", cors, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Missing Authorization header", cors, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { 
    global: { headers: { Authorization: authHeader } } 
  });
  
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) return jsonError("Invalid or expired token", cors, 401);
  
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
  });

  const isAllowed = await checkRateLimit(admin, user.id, "reset_game", 3, 1);
  if (!isAllowed) return jsonError("Rate limit exceeded. Please wait.", cors, 429);

  let body: { roomId?: unknown };
  try { 
    body = await req.json(); 
  } catch { 
    return jsonError("Invalid JSON body", cors); 
  }
  
  const { roomId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);

  const { data: room, error: rErr } = await admin.from("rooms").select("host_id, phase").eq("id", roomId).maybeSingle();
  if (rErr || !room) return jsonError(rErr?.message ?? "Room not found", cors, rErr ? 500 : 404);

  // Allow host to reset. Also allow reset if the host is disconnected? 
  // For simplicity, we just enforce host check for reset unless it's abandoned.
  if (room.host_id !== user.id) {
    // If not host, maybe check if host is disconnected
    const { data: hostPlayer } = await admin.from("room_players").select("is_connected").eq("room_id", roomId).eq("player_id", room.host_id).maybeSingle();
    if (hostPlayer && hostPlayer.is_connected) {
      return jsonError("Only the host can restart the game", cors, 403);
    }
  }

  // 1. Delete player roles and round results
  await admin.from("player_roles").delete().eq("room_id", roomId);
  await admin.from("round_results").delete().eq("room_id", roomId);

  // 2. Reset player scores to 0
  await admin.from("room_players").update({ score: 0 }).eq("room_id", roomId);

  // 3. Reset room phase to WAITING and current_round to 1
  await admin.from("rooms").update({ 
    phase: "WAITING",
    current_round: 1
  }).eq("id", roomId);

  // 4. Broadcast reset so clients can update their local state
  await sendBroadcast(admin, roomId, "GAME_RESET", {});

  return jsonSuccess({ success: true }, cors);
});
