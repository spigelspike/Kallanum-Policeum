import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { checkRateLimit } from "../_shared/rateLimit.ts";

import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    const reporterId = user.id

    const isAllowed = await checkRateLimit(supabase, reporterId, "report_world_chat", 60, 3);
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait.' }), { status: 429, headers: corsHeaders })
    }

    // 2. Parse payload
    const { messageId } = await req.json()
    if (!messageId || typeof messageId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid messageId' }), { status: 400, headers: corsHeaders })
    }

    // 3. Insert report
    const { error: insertError } = await supabase
      .from('world_chat_reports')
      .insert({
        reporter_id: reporterId,
        message_id: messageId
      })
    
    // Ignore duplicate report errors (code 23505)
    if (insertError && insertError.code !== '23505') {
      throw insertError
    }

    // 4. Check if the author of this message has reached 5 reports
    // First, get the author's player_id
    const { data: msgData } = await supabase
      .from('world_chat')
      .select('player_id')
      .eq('id', messageId)
      .single()

    if (msgData) {
      const authorId = msgData.player_id

      // Count total distinct reports against this author's messages
      const { data: reportsData } = await supabase
        .from('world_chat_reports')
        .select(`
          message_id,
          world_chat!inner(player_id)
        `)
        .eq('world_chat.player_id', authorId)

      // We only care about unique reports from people on this author's messages
      // Actually, standard `select` gives an array.
      if (reportsData && reportsData.length >= 5) {
        // Block the user
        await supabase
          .from('world_chat_blocked')
          .upsert({ player_id: authorId })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
