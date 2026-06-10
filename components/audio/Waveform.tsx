"use client";

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  audioUrl: string;
  onReady?: (wavesurfer: WaveSurfer) => void;
}

export default function Waveform({ audioUrl, onReady }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 48,
      waveColor: "#a1a1aa",
      progressColor: "#18181b",
      cursorColor: "#18181b",
      barWidth: 2,
      barGap: 1,
      interact: false,
      url: audioUrl,
    });

    wavesurfer.on("ready", () => {
      onReadyRef.current?.(wavesurfer);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  return <div ref={containerRef} className="w-full" data-testid="waveform" />;
}
