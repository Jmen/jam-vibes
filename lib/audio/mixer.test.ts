import { describe, it, expect } from "vitest";
import { computeTrackGain } from "./mixer";

describe("computeTrackGain", () => {
  it("plays at the track volume by default", () => {
    expect(
      computeTrackGain({ volume: 0.7, muted: false, soloed: false }, false),
    ).toBe(0.7);
  });

  it("is silent when muted", () => {
    expect(
      computeTrackGain({ volume: 0.7, muted: true, soloed: false }, false),
    ).toBe(0);
  });

  it("is silent when another track is soloed", () => {
    expect(
      computeTrackGain({ volume: 0.7, muted: false, soloed: false }, true),
    ).toBe(0);
  });

  it("plays when it is the soloed track", () => {
    expect(
      computeTrackGain({ volume: 0.7, muted: false, soloed: true }, true),
    ).toBe(0.7);
  });

  it("mute beats solo on the same track", () => {
    expect(
      computeTrackGain({ volume: 0.7, muted: true, soloed: true }, true),
    ).toBe(0);
  });
});
