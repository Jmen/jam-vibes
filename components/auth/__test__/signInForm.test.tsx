import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../signInForm";
import { apiClient, ApiError } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiClient: {
      auth: {
        signIn: vi.fn(),
      },
    },
  };
});

const signIn = vi.mocked(apiClient.auth.signIn);

describe("SignInForm", () => {
  beforeEach(() => {
    signIn.mockReset();
  });

  it("signs in with the entered credentials", async () => {
    const onSuccess = vi.fn();
    signIn.mockResolvedValue({
      userId: "user-1",
      email: "me@example.com",
      accessToken: "token",
      refreshToken: "refresh",
    });

    render(<SignInForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/email/i), "me@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password-123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(signIn).toHaveBeenCalledWith({
      email: "me@example.com",
      password: "password-123",
    });
  });

  it("shows validation errors before calling the API", async () => {
    render(<SignInForm onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/email/i), "not-an-email");
    await userEvent.type(screen.getByLabelText(/password/i), "short");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findAllByText(/invalid|at least/i)).not.toHaveLength(
      0,
    );
    expect(signIn).not.toHaveBeenCalled();
  });

  it("surfaces API errors to the user", async () => {
    signIn.mockRejectedValue(
      new ApiError(400, "invalid_credentials", "Invalid login credentials"),
    );

    render(<SignInForm onSuccess={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/email/i), "me@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid login credentials/i),
    ).toBeInTheDocument();
  });
});
