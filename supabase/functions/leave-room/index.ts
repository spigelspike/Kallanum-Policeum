import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBroadcast } from "../_shared/broadcast.ts";

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const isAllowed = true;
  return { 
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "", 
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", 
    "Access-Control-Allow-Methods": "POST, OPTIONS" 
  };
}

function jsonError(msg: string, cors: Record<string, string>, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function jsonSuccess(data: Record<string, unknown>, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
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

  let body: { roomId?: unknown };
  try { 
    body = await req.json(); 
  } catch { 
    return jsonError("Invalid JSON body", cors); 
  }
  
  const { roomId } = body;
  if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);

  // 1. Get room details
  const { data: room, error: rErr } = await admin.from("rooms").select("id, host_id, phase").eq("id", roomId).maybeSingle();
  if (rErr || !room) return jsonError("Room not found", cors, 404);

  // 2. Delete player from room_players
  await admin.from("room_players").delete().eq("room_id", roomId).eq("player_id", user.id);

  // Broadcast player left
  await sendBroadcast(admin, roomId, "PLAYER_LEFT", { playerId: user.id });

  // 3. Handle Host Transfer if the leaving player was the host
  if (room.host_id === user.id) {
    const { data: remainingPlayers } = await admin
      .from("room_players")
      .select("player_id, username")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (remainingPlayers && remainingPlayers.length > 0) {
      const newHost = remainingPlayers[0];
      await admin.from("rooms").update({ host_id: newHost.player_id }).eq("id", roomId);
      await sendBroadcast(admin, roomId, "HOST_TRANSFERRED", { 
        newHostId: newHost.player_id, 
        newHostUsername: newHost.username, 
        reason: "Previous host left" 
      });
    } else {
      // Room is empty, could optionally delete it, but it expires automatically so it's fine.
    }
  }

  return jsonSuccess({ success: true }, cors);
});
