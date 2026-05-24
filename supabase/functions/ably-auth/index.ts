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

    if (!ablyApiKey) throw new Error('Missing ABLY_API_KEY')

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

    // 2. Request Ably Token using REST API
    const [keyName, keySecret] = ablyApiKey.split(':')
    if (!keyName || !keySecret) throw new Error('Invalid ABLY_API_KEY format')

    // Restrict capabilities to only subscribe and presence on world-chat
    const tokenParams = {
      clientId: user.id,
      capability: JSON.stringify({
        "world-chat": ["subscribe", "presence"]
      }),
      // Token valid for 2 hours
      ttl: 7200000 
    };

    const ablyRes = await fetch(`https://rest.ably.io/keys/${keyName}/requestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(ablyApiKey)}`
      },
      body: JSON.stringify(tokenParams)
    });

    if (!ablyRes.ok) {
      const text = await ablyRes.text();
      console.error("Ably error:", text);
      throw new Error("Failed to generate Ably token");
    }

    const tokenDetails = await ablyRes.json();

    // The frontend Ably client expects exactly this tokenDetails object
    return new Response(JSON.stringify(tokenDetails), {
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
