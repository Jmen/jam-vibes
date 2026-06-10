import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../registerForm";
import { apiClient, ApiError } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiClient: {
      auth: {
        register: vi.fn(),
      },
    },
  };
});

const register = vi.mocked(apiClient.auth.register);

describe("RegisterForm", () => {
  beforeEach(() => {
    register.mockReset();
  });

  it("registers a new account", async () => {
    const onSuccess = vi.fn();
    register.mockResolvedValue({
      userId: "user-1",
      email: "new@example.com",
      accessToken: "token",
      refreshToken: "refresh",
    });

    render(<RegisterForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/email/i), "new@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password-123");
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(register).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password-123",
    });
  });

  it("shows the API error when the email is taken", async () => {
    register.mockRejectedValue(
      new ApiError(400, "user_already_exists", "User already registered"),
    );

    render(<RegisterForm onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/email/i), "dupe@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password-123");
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
  });
});
