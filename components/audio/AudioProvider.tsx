"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";

interface AudioContextValue {
  // Lazily created on first user gesture; browsers block audio before that
  getAudioContext: () => AudioContext;
  playingLoopId: string | null;
  setPlayingLoopId: (loopId: string | null) => void;
  registerStopFunction: (loopId: string, stop: () => void) => void;
  unregisterStopFunction: (loopId: string) => void;
}

const SharedAudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const stopFunctionsRef = useRef<Map<string, () => void>>(new Map());
  // Mirrors the state: stopping the previous loop is a side effect, so it
  // must happen in the event handler — never inside the setState updater,
  // which React runs during render
  const playingLoopIdRef = useRef<string | null>(null);
  const [playingLoopId, setPlayingLoopIdState] = useState<string | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const setPlayingLoopId = useCallback((loopId: string | null) => {
    const previous = playingLoopIdRef.current;

    // One loop at a time: stop whichever was playing before
    if (previous && previous !== loopId) {
      stopFunctionsRef.current.get(previous)?.();
    }

    playingLoopIdRef.current = loopId;
    setPlayingLoopIdState(loopId);
  }, []);

  const registerStopFunction = useCallback(
    (loopId: string, stop: () => void) => {
      stopFunctionsRef.current.set(loopId, stop);
    },
    [],
  );

  const unregisterStopFunction = useCallback((loopId: string) => {
    stopFunctionsRef.current.delete(loopId);
  }, []);

  return (
    <SharedAudioContext.Provider
      value={{
        getAudioContext,
        playingLoopId,
        setPlayingLoopId,
        registerStopFunction,
        unregisterStopFunction,
      }}
    >
      {children}
    </SharedAudioContext.Provider>
  );
}

export function useSharedAudio(): AudioContextValue {
  const value = useContext(SharedAudioContext);

  if (!value) {
    throw new Error("useSharedAudio must be used inside <AudioProvider>");
  }

  return value;
}
