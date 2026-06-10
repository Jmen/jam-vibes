import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useEffect, useState } from "react";
import { AudioProvider, useSharedAudio } from "../AudioProvider";

// Mimics LoopPlayer's contract: registers a stop function that sets state,
// exactly what triggered the setState-during-render bug when the provider
// ran stop functions inside its state updater
function FakePlayer({ id }: { id: string }) {
  const {
    playingLoopId,
    setPlayingLoopId,
    registerStopFunction,
    unregisterStopFunction,
  } = useSharedAudio();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    registerStopFunction(id, () => setIsPlaying(false));
    return () => unregisterStopFunction(id);
  }, [id, registerStopFunction, unregisterStopFunction]);

  return (
    <div>
      <button
        onClick={() => {
          if (isPlaying) {
            setIsPlaying(false);
            setPlayingLoopId(null);
          } else {
            setPlayingLoopId(id);
            setIsPlaying(true);
          }
        }}
      >
        toggle-{id}
      </button>
      <span data-testid={`status-${id}`}>
        {isPlaying ? "playing" : "stopped"}
      </span>
      <span data-testid={`current-${id}`}>{playingLoopId ?? "none"}</span>
    </div>
  );
}

// NOTE: render-phase setState warnings (the bug that motivated this file)
// cannot be reproduced in jsdom — React's eager-state optimization caches
// the updater result here, while the real dev server re-runs it during
// render. The browser-level guard lives in __test__/smoke/playback.spec.ts.
describe("AudioProvider", () => {
  it("starting another loop stops the one that was playing", async () => {
    render(
      <StrictMode>
        <AudioProvider>
          <FakePlayer id="a" />
          <FakePlayer id="b" />
        </AudioProvider>
      </StrictMode>,
    );

    await userEvent.click(screen.getByRole("button", { name: "toggle-a" }));
    expect(screen.getByTestId("status-a")).toHaveTextContent("playing");

    await userEvent.click(screen.getByRole("button", { name: "toggle-b" }));

    expect(screen.getByTestId("status-a")).toHaveTextContent("stopped");
    expect(screen.getByTestId("status-b")).toHaveTextContent("playing");
    expect(screen.getByTestId("current-b")).toHaveTextContent("b");
  });
});
