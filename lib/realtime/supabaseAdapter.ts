"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/clients/browser";
import { RealtimeAdapter } from "./adapter";

// RLS applies to subscribers: anonymous listeners receive inserts only for
// public jams; members receive them for their private jams.
export function createSupabaseRealtimeAdapter(): RealtimeAdapter {
  return {
    subscribeToJamLoops(jamId: string, onLoopAdded: () => void): () => void {
      const supabase = createBrowserSupabaseClient();

      const channel = supabase
        .channel(`jam-loops-${jamId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "loops",
            filter: `jam_id=eq.${jamId}`,
          },
          () => {
            onLoopAdded();
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    },
  };
}
