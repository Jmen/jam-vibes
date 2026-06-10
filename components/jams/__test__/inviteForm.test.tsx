import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteForm, inviteLink } from "../inviteForm";
import { apiClient } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiClient: {
      jams: {
        createInvite: vi.fn(),
      },
    },
  };
});

const createInvite = vi.mocked(apiClient.jams.createInvite);

describe("InviteForm", () => {
  beforeEach(() => {
    createInvite.mockReset();
  });

  it("creates an invite and shows a shareable link with the token", async () => {
    createInvite.mockResolvedValue({
      id: "invite-1",
      jamId: "jam-1",
      email: "friend@example.com",
      token: "secret-token-123",
      createdAt: new Date().toISOString(),
      acceptedAt: null,
    });

    render(<InviteForm jamId="jam-1" />);

    await userEvent.type(
      screen.getByLabelText(/invite by email/i),
      "friend@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() =>
      expect(createInvite).toHaveBeenCalledWith("jam-1", {
        email: "friend@example.com",
      }),
    );

    const link = await screen.findByTestId("invite-link");
    expect(link.textContent).toContain("secret-token-123");
    expect(link.textContent).toContain("/invites/accept");
  });

  it("builds invite links from the origin and token", () => {
    expect(inviteLink("https://jam.example", "tok")).toBe(
      "https://jam.example/invites/accept?token=tok",
    );
  });
});
