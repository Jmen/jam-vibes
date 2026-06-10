"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { JamView } from "@/app/api/jams/[id]/schema";
import { JamDetail } from "@/components/jams/jamDetail";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { createSupabaseRealtimeAdapter } from "@/lib/realtime/supabaseAdapter";

export default function JamPage() {
  const params = useParams<{ id: string }>();
  const [jam, setJam] = useState<JamView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJam = useCallback(async () => {
    try {
      setJam(await apiClient.jams.get(params.id));
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 404
          ? "This jam doesn't exist, or you don't have access to it."
          : "Could not load this jam.",
      );
    }
  }, [params.id]);

  useEffect(() => {
    void fetchJam();
  }, [fetchJam]);

  // Live updates: when anyone commits a loop to this jam, refetch
  useEffect(() => {
    if (!jam?.id) return;

    const adapter = createSupabaseRealtimeAdapter();
    return adapter.subscribeToJamLoops(jam.id, () => void fetchJam());
  }, [jam?.id, fetchJam]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          Back to public jams
        </Link>
      </div>
    );
  }

  if (!jam) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <AudioProvider>
      <JamDetail jam={jam} onChanged={setJam} onRefresh={() => void fetchJam()} />
    </AudioProvider>
  );
}
