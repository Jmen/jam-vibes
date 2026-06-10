"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api";
import { JamSummary } from "@/app/api/jams/schema";
import { JamCard } from "@/components/jams/JamCard";

export default function MyJamsPage() {
  const router = useRouter();
  const [jams, setJams] = useState<JamSummary[] | null>(null);

  useEffect(() => {
    apiClient.jams
      .listMine()
      .then(setJams)
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          router.push("/auth");
        }
      });
  }, [router]);

  return (
    <div>
      <section className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My jams</h1>
          <p className="mt-1 text-muted-foreground">
            Everything you own or joined.
          </p>
        </div>
        <Button asChild>
          <Link href="/jams/create">New jam</Link>
        </Button>
      </section>

      {jams && jams.length === 0 && (
        <p className="text-muted-foreground">
          No jams yet — create your first one.
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
