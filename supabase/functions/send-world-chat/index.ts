import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const ablyApiKey = Deno.env.get('ABLY_API_KEY') ?? ''

    if (!ablyApiKey) {
      throw new Error('ABLY_API_KEY is not configured')
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

    const playerId = user.id

    // 2. Parse payload
    const { message } = await req.json()
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), { status: 400, headers: corsHeaders })
    }

    // 3. Validate message format
    const trimmedMessage = message.trim()
    if (trimmedMessage.length === 0) {
      return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400, headers: corsHeaders })
    }
    if (trimmedMessage.length > 200) {
      return new Response(JSON.stringify({ error: 'Message too long' }), { status: 400, headers: corsHeaders })
    }
    // Max 3 consecutive newlines
    if (/\n{4,}/.test(trimmedMessage)) {
      return new Response(JSON.stringify({ error: 'Too many newlines' }), { status: 400, headers: corsHeaders })
    }

    // 4. Check if blocked
    const { data: blockedData, error: blockedError } = await supabase
      .from('world_chat_blocked')
      .select('player_id')
      .eq('player_id', playerId)
      .single()

    if (blockedData) {
      return new Response(JSON.stringify({ error: 'You are blocked from world chat.' }), { status: 403, headers: corsHeaders })
    }

    // 5. Rate limit: Max 3 messages in the last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
    const { count, error: countError } = await supabase
      .from('world_chat')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .gte('created_at', fiveSecondsAgo)

    if (countError) throw countError

    if (count !== null && count >= 3) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }), { status: 429, headers: corsHeaders })
    }

    // 6. Fetch username
    // Usernames are in room_players, but actually `useProfileStore` saves to auth.users metadata?
    // Wait, the game uses anonymous auth with `raw_user_meta_data.username`
    const username = user.user_metadata?.username ?? 'Anonymous'

    // 7. Insert to database
    const { data: insertedMsg, error: insertError } = await supabase
      .from('world_chat')
      .insert({
        player_id: playerId,
        username,
        message: trimmedMessage
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 8. Publish to Ably
    const ablyResp = await fetch(`https://rest.ably.io/channels/world-chat/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(ablyApiKey)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'message',
        data: {
          id: insertedMsg.id,
          playerId: insertedMsg.player_id,
          username: insertedMsg.username,
          message: insertedMsg.message,
          timestamp: new Date(insertedMsg.created_at).getTime()
        }
      })
    })

    if (!ablyResp.ok) {
      console.error('Ably error:', await ablyResp.text())
      throw new Error('Failed to publish to Ably')
    }

    return new Response(JSON.stringify({ success: true, id: insertedMsg.id }), {
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
