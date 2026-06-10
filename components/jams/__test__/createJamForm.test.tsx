import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateJamForm } from "../createJamForm";
import { apiClient } from "@/lib/api";
import { JamSummary } from "@/app/api/jams/schema";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiClient: {
      jams: {
        create: vi.fn(),
      },
    },
  };
});

const create = vi.mocked(apiClient.jams.create);

const createdJam: JamSummary = {
  id: "jam-1",
  humanId: "brave-magenta-walrus-x4f2",
  name: "Friday Jam",
  description: "",
  access: "private",
  createdAt: new Date().toISOString(),
  ownerId: "user-1",
  ownerUsername: "me",
  photoUrl: null,
  loopCount: 0,
};

describe("CreateJamForm", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("creates a private jam by default", async () => {
    const onCreated = vi.fn();
    create.mockResolvedValue(createdJam);

    render(<CreateJamForm onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText(/name/i), "Friday Jam");
    await userEvent.click(screen.getByRole("button", { name: /create jam/i }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(createdJam));
    expect(create).toHaveBeenCalledWith({
      name: "Friday Jam",
      description: "",
      access: "private",
    });
  });

  it("can create a public jam", async () => {
    create.mockResolvedValue({ ...createdJam, access: "public" });

    render(<CreateJamForm onCreated={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/name/i), "Open Jam");
    await userEvent.click(screen.getByRole("button", { name: /public/i }));
    await userEvent.click(screen.getByRole("button", { name: /create jam/i }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: "Open Jam",
        description: "",
        access: "public",
      }),
    );
  });

  it("requires a name", async () => {
    render(<CreateJamForm onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /create jam/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
