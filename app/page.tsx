"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { JamSummary } from "@/app/api/jams/schema";
import { JamCard } from "@/components/jams/JamCard";

export default function HomePage() {
  const [jams, setJams] = useState<JamSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.jams
      .listPublic()
      .then(setJams)
      .catch(() => setError("Could not load public jams"));
  }, []);

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold">Public jams</h1>
        <p className="mt-1 text-muted-foreground">
          Listen to what people are making — or sign in to start your own.
        </p>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {jams && jams.length === 0 && (
        <p className="text-muted-foreground">
          Nothing public yet. Be the first!
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(jams ?? []).map((jam) => (
          <JamCard key={jam.id} jam={jam} />
        ))}
      </div>
    </div>
  );
}
