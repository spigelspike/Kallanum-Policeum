import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBroadcast } from "../_shared/broadcast.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders, jsonError, jsonSuccess } from "../_shared/cors.ts";

// ── Bot Identity Pool ──
const BOT_NAMES = [
  "Arjun", "Meera", "Vikram", "Priya", "Ravi",
  "Anjali", "Kiran", "Deepa", "Sanjay", "Kavya",
  "Rahul", "Sneha", "Arun", "Lakshmi",
];
const BOT_AVATARS = ["male1", "male2", "male3", "female1", "female2", "female3"];

// ── Role Pool (same as start-game & next-round) ──
const ROLE_POOL = [
  { name: "King", points: 1000 }, { name: "Queen", points: 800 },
  { name: "Minister", points: 700 }, { name: "General", points: 600 },
  { name: "Judge", points: 500 }, { name: "Doctor", points: 450 },
  { name: "Engineer", points: 400 }, { name: "Teacher", points: 350 },
  { name: "Merchant", points: 300 }, { name: "Farmer", points: 250 },
  { name: "Carpenter", points: 200 }, { name: "Guard", points: 180 },
  { name: "Servant", points: 150 },
];

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

function generateRoomCode(): string {
  const values = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
}

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

function isValidUsername(username: unknown): username is string {
  if (typeof username !== "string") return false;
  const trimmed = username.trim();
  return trimmed.length > 0 && trimmed.length <= 20 && /^[a-zA-Z0-9 ]+$/.test(trimmed);
}

const VALID_AVATAR_KEYS = ["male1", "male2", "male3", "female1", "female2", "female3"];
function isValidAvatarKey(value: unknown): value is string {
  return typeof value === "string" && VALID_AVATAR_KEYS.includes(value);
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

  const isAllowed = await checkRateLimit(admin, user.id, "quick_play", 3, 1);
  if (!isAllowed) return jsonError("Rate limit exceeded. Please wait.", cors, 429);

  // Parse body
  let body: { action?: unknown; username?: unknown; avatarKey?: unknown; roomId?: unknown; totalRounds?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", cors); }

  const action = typeof body.action === "string" ? body.action : "join";

  // ── ACTION: JOIN OR CREATE QUICK PLAY ROOM ──
  if (action === "join") {
    const { username: rawUsername, avatarKey: rawAvatarKey, totalRounds: rawRounds } = body;
    if (!isValidUsername(rawUsername)) return jsonError("Username must be 1-20 chars, alphanumeric and spaces only", cors);
    const username = (rawUsername as string).trim();
    const avatarKey = isValidAvatarKey(rawAvatarKey) ? rawAvatarKey : null;
    const totalRounds = typeof rawRounds === "number" && rawRounds >= 1 && rawRounds <= 10 ? rawRounds : 3;

    // 1. Look for an existing WAITING quick play room with < 5 players
    const { data: activeRooms, error: roomsErr } = await admin
      .from("rooms")
      .select("id, code, host_id, total_rounds")
      .eq("is_quick_play", true)
      .eq("phase", "WAITING")
      .gt("expires_at", new Date().toISOString());

    let targetRoom: { id: string; code: string; host_id: string; total_rounds: number } | null = null;
    if (activeRooms && !roomsErr) {
      for (const r of activeRooms) {
        const { count } = await admin
          .from("room_players")
          .select("id", { count: "exact", head: true })
          .eq("room_id", r.id);
        if ((count ?? 0) < 5) {
          targetRoom = r;
          break;
        }
      }
    }

    // 2. Join matched room if found
    if (targetRoom) {
      // Check if user is already in this room
      const { data: existingPlayer } = await admin
        .from("room_players")
        .select("id")
        .eq("room_id", targetRoom.id)
        .eq("player_id", user.id)
        .maybeSingle();

      if (!existingPlayer) {
        const { error: joinErr } = await admin
          .from("room_players")
          .insert({ room_id: targetRoom.id, player_id: user.id, username, avatar_key: avatarKey, is_bot: false });
        if (joinErr) return jsonError("Failed to join matched quick play room", cors, 500);
      }

      // Broadcast join to others in the room
      await sendBroadcast(admin, targetRoom.id, "PLAYER_JOINED", {
        id: user.id,
        username,
        score: 0,
        isConnected: true,
        isHost: targetRoom.host_id === user.id,
        avatarKey,
        isBot: false,
      });

      return jsonSuccess({ roomId: targetRoom.id, roomCode: targetRoom.code }, cors);
    }

    // 3. If no room found, create a new one
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await admin.from("rooms").select("id").eq("code", code).maybeSingle();
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }
    if (attempts >= 10) return jsonError("Failed to generate a unique room code", cors, 500);

    const { data: room, error: roomError } = await admin
      .from("rooms")
      .insert({ code, host_id: user.id, phase: "WAITING", current_round: 1, total_rounds: totalRounds, max_players: 5, is_quick_play: true })
      .select("id, code")
      .single();
    if (roomError || !room) return jsonError(roomError?.message ?? "Failed to create quick play room", cors, 500);

    const { error: hostError } = await admin
      .from("room_players")
      .insert({ room_id: room.id, player_id: user.id, username, avatar_key: avatarKey, is_bot: false });
    if (hostError) {
      await admin.from("rooms").delete().eq("id", room.id);
      return jsonError("Failed to add host player", cors, 500);
    }

    return jsonSuccess({ roomId: room.id, roomCode: room.code }, cors);
  }

  // ── ACTION: FILL WITH BOTS AND START GAME ──
  if (action === "fill-and-start") {
    const { roomId } = body;
    if (typeof roomId !== "string" || !roomId) return jsonError("roomId is required", cors);

    const { data: room, error: roomErr } = await admin
      .from("rooms")
      .select("id, code, host_id, phase, current_round, total_rounds, expires_at, is_quick_play")
      .eq("id", roomId)
      .maybeSingle();

    if (roomErr || !room) return jsonError(roomErr?.message ?? "Room not found", cors, roomErr ? 500 : 404);
    if (room.phase !== "WAITING") return jsonError("Game has already started", cors);

    // Fetch existing real players in the room
    const { data: players, error: pErr } = await admin
      .from("room_players")
      .select("id, player_id, username, score, is_connected, avatar_key, is_bot")
      .eq("room_id", roomId);
    if (pErr || !players) return jsonError("Failed to fetch players", cors, 500);

    const currentCount = players.length;
    const botCountNeeded = Math.max(0, 5 - currentCount);

    // If we need bots, insert them
    const shuffledNames = fisherYatesShuffle(BOT_NAMES);
    const addedBots = [];

    for (let i = 0; i < botCountNeeded; i++) {
      const botId = `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`;
      const botName = shuffledNames[i % shuffledNames.length];
      const botAvatar = BOT_AVATARS[i % BOT_AVATARS.length];

      const { error: botError } = await admin
        .from("room_players")
        .insert({
          room_id: roomId,
          player_id: botId,
          username: botName,
          avatar_key: botAvatar,
          is_bot: true,
          is_connected: true,
        });

      if (botError) {
        console.error(`Failed to insert bot ${i}:`, botError);
      } else {
        addedBots.push({
          player_id: botId,
          username: botName,
          score: 0,
          is_connected: true,
          avatar_key: botAvatar,
          is_bot: true
        });
      }
    }

    const allPlayers = [...players, ...addedBots];

    if (allPlayers.length < 3) {
      return jsonError("Not enough players to start the game (minimum 3)", cors);
    }

    // Assign Roles
    const fillerCount = allPlayers.length - 2;
    const fullRoleList = [
      { name: "Police", points: 0 }, { name: "Thief", points: 0 },
      ...ROLE_POOL.slice(0, fillerCount).map((r) => ({ name: r.name, points: r.points })),
    ];
    const shuffledRoles = fisherYatesShuffle(fullRoleList);

    let policePlayerId: string | null = null;
    for (let i = 0; i < allPlayers.length; i++) {
      const { error: insErr } = await admin.from("player_roles").insert({
        room_id: roomId,
        player_id: allPlayers[i].player_id,
        round_number: room.current_round,
        role: shuffledRoles[i].name,
        role_points: shuffledRoles[i].points,
      });

      if (insErr) {
        console.error(`Failed to assign role to player ${allPlayers[i].player_id}:`, insErr);
        return jsonError(`Failed to assign roles: ${insErr.message}`, cors, 500);
      }

      if (shuffledRoles[i].name === "Police") {
        policePlayerId = allPlayers[i].player_id;
      }
    }

    if (!policePlayerId) {
      return jsonError("Critical: no Police assigned", cors, 500);
    }

    // Set Room phase to DISCUSSION
    const phaseEndsAt = new Date(Date.now() + 30000).toISOString();
    const { error: updErr } = await admin
      .from("rooms")
      .update({ phase: "DISCUSSION", phase_ends_at: phaseEndsAt })
      .eq("id", roomId);

    if (updErr) {
      return jsonError(`Failed to update room phase: ${updErr.message}`, cors, 500);
    }

    // Send Broadcast
    const policePlayer = allPlayers.find(p => p.player_id === policePlayerId);
    const botPolice = policePlayer?.is_bot ?? false;

    const playersList = allPlayers.map((p) => ({
      id: p.player_id,
      username: p.username,
      score: p.score ?? 0,
      isConnected: p.is_connected,
      isHost: p.player_id === room.host_id,
      avatarKey: p.avatar_key ?? null,
      isBot: p.is_bot ?? false,
    }));

    await sendBroadcast(admin, roomId, "GAME_STARTED", {
      policeId: policePlayerId,
      phase: "DISCUSSION",
      phaseEndsAt,
      botPolice,
      players: playersList,
    });

    return jsonSuccess({ success: true, policeId: policePlayerId, botPolice, players: playersList }, cors);
  }

  return jsonError("Invalid action", cors, 400);
});
