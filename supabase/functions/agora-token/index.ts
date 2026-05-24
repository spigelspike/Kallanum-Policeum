import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import pkg from "npm:agora-access-token@2.0.4"

const { RtcTokenBuilder, RtcRole } = pkg;

import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const appId = Deno.env.get('AGORA_APP_ID') ?? ''
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE') ?? ''

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Auth header' }), { status: 401, headers: corsHeaders })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // 2. Parse payload
    const { roomCode, uid } = await req.json()
    if (!roomCode || typeof roomCode !== 'string' || typeof uid !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: corsHeaders })
    }

    // 3. Verify user is in the room
    const { data: room, error: rErr } = await supabase.from('rooms').select('id, expires_at').eq('code', roomCode).maybeSingle()
    if (rErr || !room) {
       return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404, headers: corsHeaders })
    }

    const { data: player, error: pErr } = await supabase.from('room_players').select('id').eq('room_id', room.id).eq('player_id', user.id).maybeSingle()
    if (pErr || !player) {
      return new Response(JSON.stringify({ error: 'You are not in this room' }), { status: 403, headers: corsHeaders })
    }

    // 4. Generate Token
    const currentTimestamp = Math.floor(Date.now() / 1000)
    let expirationTimeInSeconds = 3600
    
    if (room.expires_at) {
      const msUntilExpiry = new Date(room.expires_at).getTime() - Date.now()
      if (msUntilExpiry > 0) {
        expirationTimeInSeconds = Math.min(3600, Math.floor(msUntilExpiry / 1000))
      } else {
        return new Response(JSON.stringify({ error: 'Room expired' }), { status: 410, headers: corsHeaders })
      }
    }

    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      roomCode,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
