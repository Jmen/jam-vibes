import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JamDetail } from "../jamDetail";
import { JamView, LoopView } from "@/app/api/jams/[id]/schema";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiClient: {
      jams: { update: vi.fn(), uploadPhoto: vi.fn(), createInvite: vi.fn() },
    },
  };
});

// The real players need Web Audio, which jsdom doesn't have; the player has
// its own pure-logic tests (mixer) and is exercised by the smoke test
vi.mock("@/components/audio/LoopPlayer", () => ({
  LoopPlayer: ({ loop }: { loop: LoopView }) => (
    <div data-testid={`loop-player-${loop.id}`} />
  ),
}));

vi.mock("@/components/audio/DraftLoop", () => ({
  DraftLoop: ({ parentLoopId }: { parentLoopId?: string }) => (
    <div data-testid="draft-loop" data-parent={parentLoopId ?? ""} />
  ),
}));

function jamWith(overrides: Partial<JamView>): JamView {
  return {
    id: "jam-1",
    humanId: "brave-walrus-1234",
    name: "Test Jam",
    description: "A jam for testing",
    access: "private",
    createdAt: new Date().toISOString(),
    ownerId: "owner-1",
    ownerUsername: "owner",
    photoUrl: null,
    viewerRole: "visitor",
    loops: [],
    ...overrides,
  };
}

function loopWith(id: string): LoopView {
  return {
    id,
    createdAt: new Date().toISOString(),
    parentId: null,
    ownerUsername: "owner",
    audio: [],
  };
}

describe("JamDetail", () => {
  it("shows every loop and the draft tray for members", () => {
    const jam = jamWith({
      viewerRole: "member",
      loops: [loopWith("loop-1"), loopWith("loop-2")],
    });

    render(<JamDetail jam={jam} onChanged={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByTestId("loop-player-loop-1")).toBeInTheDocument();
    expect(screen.getByTestId("loop-player-loop-2")).toBeInTheDocument();
    expect(screen.getByTestId("draft-loop")).toBeInTheDocument();
  });

  it("new loops build on the latest loop (lineage)", () => {
    const jam = jamWith({
      viewerRole: "member",
      loops: [loopWith("loop-1"), loopWith("loop-2")],
    });

    render(<JamDetail jam={jam} onChanged={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByTestId("draft-loop").dataset.parent).toBe("loop-2");
  });

  it("visitors can listen but see no contribution or owner controls", () => {
    const jam = jamWith({
      viewerRole: "visitor",
      access: "public",
      loops: [loopWith("loop-1")],
    });

    render(<JamDetail jam={jam} onChanged={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByTestId("loop-player-loop-1")).toBeInTheDocument();
    expect(screen.queryByTestId("draft-loop")).not.toBeInTheDocument();
    expect(screen.queryByTestId("toggle-access")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/invite by email/i),
    ).not.toBeInTheDocument();
  });

  it("owners get visibility, photo and invite controls", () => {
    const jam = jamWith({ viewerRole: "owner" });

    render(<JamDetail jam={jam} onChanged={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByTestId("toggle-access")).toBeInTheDocument();
    expect(screen.getByLabelText(/invite by email/i)).toBeInTheDocument();
    expect(screen.getByText(/add photo/i)).toBeInTheDocument();
  });

  it("members can contribute but cannot manage the jam", () => {
    const jam = jamWith({ viewerRole: "member" });

    render(<JamDetail jam={jam} onChanged={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByTestId("draft-loop")).toBeInTheDocument();
    expect(screen.queryByTestId("toggle-access")).not.toBeInTheDocument();
  });
});
