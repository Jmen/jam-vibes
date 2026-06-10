import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "../profileForm";
import { apiClient, ApiError } from "@/lib/api";
import { Profile } from "@/app/api/my/profile/schema";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiClient: {
      my: {
        profile: {
          update: vi.fn(),
          uploadAvatar: vi.fn(),
        },
      },
    },
  };
});

const update = vi.mocked(apiClient.my.profile.update);

const profile: Profile = {
  userId: "user-1",
  email: "me@example.com",
  username: "old-name",
  avatarUrl: null,
};

describe("ProfileForm", () => {
  beforeEach(() => {
    update.mockReset();
  });

  it("prefills and updates the username", async () => {
    const onUpdated = vi.fn();
    update.mockResolvedValue({ ...profile, username: "new-name" });

    render(<ProfileForm profile={profile} onUpdated={onUpdated} />);

    const input = screen.getByLabelText(/username/i);
    expect(input).toHaveValue("old-name");

    await userEvent.clear(input);
    await userEvent.type(input, "new-name");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ username: "new-name" }),
    );
    expect(onUpdated).toHaveBeenCalledWith({
      ...profile,
      username: "new-name",
    });
  });

  it("shows the error when the username is taken", async () => {
    update.mockRejectedValue(
      new ApiError(400, "username_taken", "That username is already taken"),
    );

    render(<ProfileForm profile={profile} onUpdated={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/username/i));
    await userEvent.type(screen.getByLabelText(/username/i), "taken-name");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
  });

  it("rejects invalid usernames before calling the API", async () => {
    render(<ProfileForm profile={profile} onUpdated={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText(/username/i));
    await userEvent.type(screen.getByLabelText(/username/i), "x");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(
      await screen.findByText(/at least 3 characters/i),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});
