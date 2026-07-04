import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChooseUsernamePage from "../page";
import { apiClient } from "@/lib/api";
import { Profile } from "@/app/api/my/profile/schema";

const { push, search } = vi.hoisted(() => ({
  push: vi.fn(),
  search: { value: "" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(search.value),
}));

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

async function chooseUsername() {
  render(<ChooseUsernamePage />);

  await userEvent.type(screen.getByLabelText(/username/i), "groove-cat");
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));
}

describe("ChooseUsernamePage", () => {
  beforeEach(() => {
    push.mockReset();
    update.mockReset();
    update.mockResolvedValue(profile);
    search.value = "";
  });

  it("continues to the original destination after saving", async () => {
    search.value = "next=%2Fjams%2F42";

    await chooseUsername();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/jams/42"));
  });

  it("continues home when there is no destination", async () => {
    await chooseUsername();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  // The full off-site matrix is pinned in lib/inAppPath.test.ts; this
  // checks the page actually routes next through that sanitizer.
  it("refuses to continue off-site", async () => {
    search.value = `next=${encodeURIComponent("/\\evil.example")}`;

    await chooseUsername();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});
