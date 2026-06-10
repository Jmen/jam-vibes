export interface TrackMixState {
  volume: number;
  muted: boolean;
  soloed: boolean;
}

// The one rule of the mixer: solo wins over everything except that track's
// own mute; mute always silences.
export function computeTrackGain(
  track: TrackMixState,
  anyTrackSoloed: boolean,
): number {
  if (track.muted) {
    return 0;
  }

  if (anyTrackSoloed && !track.soloed) {
    return 0;
  }

  return track.volume;
}
