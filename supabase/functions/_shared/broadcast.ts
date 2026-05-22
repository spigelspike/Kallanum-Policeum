import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function sendBroadcast(
  admin: SupabaseClient,
  roomId: string,
  event: string,
  payload?: Record<string, unknown>
) {
  const channel = admin.channel(`room:${roomId}`);
  
  await new Promise((resolve) => {
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.send({
          type: "broadcast",
          event,
          ...(payload ? { payload } : {})
        });
        await admin.removeChannel(channel);
        resolve(true);
      }
      
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        resolve(false);
      }
    });
    
    // Fallback timeout just in case it hangs
    setTimeout(() => {
      resolve(false);
    }, 3000);
  });
}
