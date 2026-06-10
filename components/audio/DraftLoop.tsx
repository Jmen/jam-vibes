"use client";

import { useState } from "react";
import { GitCommit, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { apiClient, ApiError } from "@/lib/api";
import { AudioView } from "@/app/api/audio/schema";
import { AudioUpload } from "./AudioUpload";

interface DraftLoopProps {
  jamId: string;
  // Lineage: a new commit builds on the latest loop
  parentLoopId?: string;
  onCommitted: () => void;
}

interface DraftTrack {
  audio: AudioView;
  volume: number;
}

const MAX_TRACKS = 8;

export function DraftLoop({ jamId, parentLoopId, onCommitted }: DraftLoopProps) {
  const [tracks, setTracks] = useState<DraftTrack[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTrack = (audio: AudioView) => {
    setTracks((previous) =>
      previous.length >= MAX_TRACKS
        ? previous
        : [...previous, { audio, volume: 1 }],
    );
  };

  const removeTrack = (audioId: string) => {
    setTracks((previous) =>
      previous.filter((track) => track.audio.id !== audioId),
    );
  };

  const setVolume = (audioId: string, volume: number) => {
    setTracks((previous) =>
      previous.map((track) =>
        track.audio.id === audioId ? { ...track, volume } : track,
      ),
    );
  };

  const commit = async () => {
    setError(null);
    setIsCommitting(true);

    try {
      await apiClient.jams.addLoop(jamId, {
        parentId: parentLoopId,
        audio: tracks.map((track) => ({
          audioId: track.audio.id,
          volume: track.volume,
        })),
      });
      setTracks([]);
      onCommitted();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Commit failed");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed p-4" data-testid="draft-loop">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Next loop</h3>
        <div className="flex items-center gap-2">
          <AudioUpload jamId={jamId} onUploaded={addTrack} />
          <Button
            onClick={() => void commit()}
            disabled={tracks.length === 0 || isCommitting}
            data-testid="commit-loop"
          >
            {isCommitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <GitCommit size={16} />
            )}
            <span className="ml-1">Commit loop</span>
          </Button>
        </div>
      </div>

      {tracks.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Upload audio to start building the next loop. Set each track&apos;s
          volume, then commit.
        </p>
      ) : (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {tracks.map((track) => (
            <div
              key={track.audio.id}
              data-testid={`draft-track-${track.audio.id}`}
              className="w-36 flex-shrink-0 rounded-md border bg-card p-2"
            >
              <div className="flex items-center justify-between gap-1">
                <p
                  className="truncate text-xs font-medium"
                  title={track.audio.fileName ?? "Audio"}
                >
                  {track.audio.fileName ?? "Audio"}
                </p>
                <button
                  onClick={() => removeTrack(track.audio.id)}
                  aria-label={`Remove ${track.audio.fileName ?? "audio"}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Slider
                  value={[track.volume]}
                  max={1}
                  step={0.01}
                  onValueChange={(value) =>
                    setVolume(track.audio.id, value[0])
                  }
                  aria-label={`Volume for ${track.audio.fileName ?? "audio"}`}
                />
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {Math.round(track.volume * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
