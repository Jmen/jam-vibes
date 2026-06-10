"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type WaveSurfer from "wavesurfer.js";
import { Play, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { computeTrackGain } from "@/lib/audio/mixer";
import { useSharedAudio } from "./AudioProvider";
import Waveform from "./Waveform";
import { LoopView } from "@/app/api/jams/[id]/schema";

interface LoopPlayerProps {
  loop: LoopView;
  loopIndex: number;
}

interface TrackState {
  volume: number;
  muted: boolean;
  soloed: boolean;
}

export function LoopPlayer({ loop, loopIndex }: LoopPlayerProps) {
  const {
    getAudioContext,
    playingLoopId,
    setPlayingLoopId,
    registerStopFunction,
    unregisterStopFunction,
  } = useSharedAudio();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Each track starts at its committed mix volume
  const [tracks, setTracks] = useState<Map<string, TrackState>>(
    () =>
      new Map(
        loop.audio.map((track) => [
          track.id,
          { volume: track.volume, muted: false, soloed: false },
        ]),
      ),
  );

  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  const sourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const wavesurfersRef = useRef<Map<string, WaveSurfer>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const stopPlayback = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    });
    sourcesRef.current.clear();

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    wavesurfersRef.current.forEach((wavesurfer) => wavesurfer.seekTo(0));

    setIsPlaying(false);
  }, []);

  useEffect(() => {
    registerStopFunction(loop.id, stopPlayback);
    const gainNodes = gainNodesRef.current;

    return () => {
      stopPlayback();
      unregisterStopFunction(loop.id);
      gainNodes.forEach((gain) => gain.disconnect());
      gainNodes.clear();
    };
  }, [loop.id, registerStopFunction, unregisterStopFunction, stopPlayback]);

  const applyTrackGain = useCallback(
    (trackId: string, current: Map<string, TrackState>) => {
      const gainNode = gainNodesRef.current.get(trackId);
      const state = current.get(trackId);
      if (!gainNode || !state) return;

      const anySoloed = Array.from(current.values()).some(
        (track) => track.soloed,
      );

      gainNode.gain.setValueAtTime(
        computeTrackGain(state, anySoloed),
        getAudioContext().currentTime,
      );
    },
    [getAudioContext],
  );

  useEffect(() => {
    tracks.forEach((_, trackId) => applyTrackGain(trackId, tracks));
  }, [tracks, applyTrackGain]);

  const ensureLoaded = useCallback(async () => {
    const context = getAudioContext();

    const missing = loop.audio.filter(
      (track) => !buffersRef.current.has(track.id),
    );

    if (missing.length === 0) return;

    setIsLoading(true);

    try {
      await Promise.all(
        missing.map(async (track) => {
          const response = await fetch(track.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.status}`);
          }
          const bytes = await response.arrayBuffer();
          const buffer = await context.decodeAudioData(bytes);
          buffersRef.current.set(track.id, buffer);
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [loop.audio, getAudioContext]);

  const startPlayback = useCallback(async () => {
    const context = getAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    await ensureLoaded();
    stopPlayback();

    loop.audio.forEach((track) => {
      const buffer = buffersRef.current.get(track.id);
      if (!buffer) return;

      let gainNode = gainNodesRef.current.get(track.id);
      if (!gainNode) {
        gainNode = context.createGain();
        gainNode.connect(context.destination);
        gainNodesRef.current.set(track.id, gainNode);
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start(0);
      sourcesRef.current.set(track.id, source);
    });

    tracks.forEach((_, trackId) => applyTrackGain(trackId, tracks));

    startTimeRef.current = context.currentTime;
    setIsPlaying(true);

    const updateCursors = () => {
      const elapsed = context.currentTime - startTimeRef.current;

      wavesurfersRef.current.forEach((wavesurfer) => {
        const duration = wavesurfer.getDuration();
        if (duration > 0) {
          wavesurfer.seekTo((elapsed % duration) / duration);
        }
      });

      animationFrameRef.current = requestAnimationFrame(updateCursors);
    };

    animationFrameRef.current = requestAnimationFrame(updateCursors);
  }, [
    getAudioContext,
    ensureLoaded,
    stopPlayback,
    loop.audio,
    tracks,
    applyTrackGain,
  ]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      stopPlayback();
      setPlayingLoopId(null);
    } else {
      setPlayingLoopId(loop.id);
      await startPlayback();
    }
  }, [isPlaying, loop.id, setPlayingLoopId, startPlayback, stopPlayback]);

  const updateTrack = (trackId: string, change: Partial<TrackState>) => {
    setTracks((previous) => {
      const next = new Map(previous);
      const current = next.get(trackId);
      if (current) {
        next.set(trackId, { ...current, ...change });
      }
      return next;
    });
  };

  return (
    <div
      data-testid={`loop-${loop.id}`}
      className={cn(
        "rounded-lg border p-4",
        playingLoopId === loop.id ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayback}
          disabled={isLoading}
          aria-label={
            isPlaying
              ? `Stop loop ${loopIndex + 1}`
              : `Play loop ${loopIndex + 1}`
          }
          className="w-24"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Square size={16} />
          ) : (
            <Play size={16} />
          )}
          <span className="ml-1">
            {isLoading ? "Loading" : isPlaying ? "Stop" : "Play"}
          </span>
        </Button>
        <h3 className="font-semibold">Loop {loopIndex + 1}</h3>
        <p className="text-xs text-muted-foreground">
          {`by ${loop.ownerUsername} · `}
          {new Date(loop.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {loop.audio.map((track) => {
          const state = tracks.get(track.id);

          return (
            <div
              key={track.id}
              data-testid={`track-${track.id}`}
              className="w-36 flex-shrink-0"
            >
              <div
                className={cn(
                  "h-14 overflow-hidden rounded-md border-2 bg-card px-1",
                  state?.soloed
                    ? "border-primary"
                    : state?.muted
                      ? "border-muted opacity-50"
                      : "border-border",
                )}
              >
                <Waveform
                  audioUrl={track.url}
                  onReady={(wavesurfer) =>
                    wavesurfersRef.current.set(track.id, wavesurfer)
                  }
                />
              </div>
              <p
                className="mt-1 truncate text-center text-xs text-muted-foreground"
                title={track.fileName ?? "Audio"}
              >
                {track.fileName ?? "Audio"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Slider
                  value={[state?.volume ?? 1]}
                  max={1}
                  step={0.01}
                  onValueChange={(value) =>
                    updateTrack(track.id, { volume: value[0] })
                  }
                  aria-label={`Volume for ${track.fileName ?? "audio"}`}
                  className="flex-1"
                />
              </div>
              <div className="mt-1 flex justify-center gap-1">
                <button
                  onClick={() =>
                    updateTrack(track.id, { muted: !state?.muted })
                  }
                  className={cn(
                    "h-6 w-8 rounded border text-xs font-bold",
                    state?.muted
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                  title="Mute"
                >
                  M
                </button>
                <button
                  onClick={() =>
                    updateTrack(track.id, { soloed: !state?.soloed })
                  }
                  className={cn(
                    "h-6 w-8 rounded border text-xs font-bold",
                    state?.soloed
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground",
                  )}
                  title="Solo"
                >
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
