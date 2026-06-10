import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsernameForm } from "../usernameForm";
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
        },
      },
    },
  };
});

const update = vi.mocked(apiClient.my.profile.update);

const profile: Profile = {
  userId: "user-1",
  email: "me@example.com",
  username: "groove-cat",
  avatarUrl: null,
};

describe("UsernameForm", () => {
  beforeEach(() => {
    update.mockReset();
  });

  it("saves the chosen username and continues", async () => {
    const onSuccess = vi.fn();
    update.mockResolvedValue(profile);

    render(<UsernameForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/username/i), "groove-cat");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ username: "groove-cat" }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("offers no way out other than submitting", () => {
    render(<UsernameForm onSuccess={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent(/continue/i);
  });

  it("shows the error when the username is taken", async () => {
    const onSuccess = vi.fn();
    update.mockRejectedValue(
      new ApiError(400, "username_taken", "That username is already taken"),
    );

    render(<UsernameForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/username/i), "taken-name");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("rejects invalid usernames before calling the API", async () => {
    render(<UsernameForm onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/username/i), "x");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      await screen.findByText(/at least 3 characters/i),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});
