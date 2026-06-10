"use client";

import { useRef, useState } from "react";
import { Globe, Lock, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient, ApiError } from "@/lib/api";
import { JamView } from "@/app/api/jams/[id]/schema";
import { LoopPlayer } from "@/components/audio/LoopPlayer";
import { DraftLoop } from "@/components/audio/DraftLoop";
import { InviteForm } from "./inviteForm";

interface JamDetailProps {
  jam: JamView;
  onChanged: (jam: JamView) => void;
  // Re-fetch without an optimistic payload (e.g. after committing a loop)
  onRefresh: () => void;
}

export function JamDetail({ jam, onChanged, onRefresh }: JamDetailProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = jam.viewerRole === "owner";
  const canContribute = jam.viewerRole !== "visitor";

  const toggleAccess = async () => {
    setError(null);
    setIsSaving(true);

    try {
      onChanged(
        await apiClient.jams.update(jam.id, {
          access: jam.access === "public" ? "private" : "public",
        }),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setError(null);
    setIsSaving(true);

    try {
      onChanged(await apiClient.jams.uploadPhoto(jam.id, file, file.name));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Upload failed");
    } finally {
      setIsSaving(false);
    }
  };

  const latestLoopId = jam.loops[jam.loops.length - 1]?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-40 w-full overflow-hidden rounded-lg bg-gradient-to-br from-violet-200 to-pink-200 sm:w-64">
          {jam.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={jam.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{jam.name}</h1>
            <span
              className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              data-testid="jam-access"
            >
              {jam.access === "public" ? (
                <Globe size={12} />
              ) : (
                <Lock size={12} />
              )}
              {jam.access}
            </span>
          </div>
          {jam.description && (
            <p className="mt-1 text-muted-foreground">{jam.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {jam.ownerUsername ? `by ${jam.ownerUsername} · ` : ""}
            created {new Date(jam.createdAt).toLocaleDateString()}
          </p>

          {isOwner && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void toggleAccess()}
                disabled={isSaving}
                data-testid="toggle-access"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : jam.access === "public" ? (
                  <Lock size={14} />
                ) : (
                  <Globe size={14} />
                )}
                <span className="ml-1">
                  Make {jam.access === "public" ? "private" : "public"}
                </span>
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                data-testid="jam-photo-input"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                disabled={isSaving}
              >
                <ImagePlus size={14} />
                <span className="ml-1">
                  {jam.photoUrl ? "Change photo" : "Add photo"}
                </span>
              </Button>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      </div>

      {isOwner && (
        <div className="rounded-lg border p-4">
          <InviteForm jamId={jam.id} />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Loops{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({jam.loops.length})
          </span>
        </h2>

        {jam.loops.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No loops yet.
            {canContribute && " Upload audio below and commit the first one."}
          </p>
        )}

        {jam.loops.map((loop, index) => (
          <LoopPlayer key={loop.id} loop={loop} loopIndex={index} />
        ))}

        {canContribute && (
          <DraftLoop
            jamId={jam.id}
            parentLoopId={latestLoopId}
            onCommitted={onRefresh}
          />
        )}
      </section>
    </div>
  );
}
