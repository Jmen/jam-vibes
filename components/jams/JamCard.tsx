"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { JamSummary } from "@/app/api/jams/schema";

export function JamCard({ jam }: { jam: JamSummary }) {
  return (
    <Link href={`/jams/${jam.humanId}`} data-testid="jam-card">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="h-32 bg-gradient-to-br from-violet-200 to-pink-200">
          {jam.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={jam.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{jam.name}</h3>
            {jam.access === "private" && (
              <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                private
              </span>
            )}
          </div>
          {jam.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {jam.description}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {jam.ownerUsername ? `by ${jam.ownerUsername} · ` : ""}
            {jam.loopCount} {jam.loopCount === 1 ? "loop" : "loops"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
