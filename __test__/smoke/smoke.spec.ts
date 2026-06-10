import { test, expect } from "@playwright/test";
import { makeTestWav } from "../acceptance/drivers/testWav";

// The one critical UI journey, end to end through the real browser:
// register → create a jam → upload audio → set the mix → commit a loop.
test("a musician can register, create a jam and commit a loop", async ({
  page,
}) => {
  const email = `smoke-${Date.now()}@example.com`;

  await page.goto("/auth");
  await page.getByRole("tab", { name: /register/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("smoke-password-123");
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("/");

  await page.goto("/jams/create");
  await page.getByLabel(/name/i).fill("Smoke Jam");
  await page.getByLabel(/description/i).fill("Created by the smoke test");
  await page.getByRole("button", { name: /create jam/i }).click();
  await page.waitForURL(/\/jams\/.+/);

  await expect(
    page.getByRole("heading", { name: "Smoke Jam" }),
  ).toBeVisible();

  await page
    .getByTestId("audio-file-input")
    .setInputFiles({
      name: "groove.wav",
      mimeType: "audio/wav",
      buffer: makeTestWav(0.5, 330),
    });

  await expect(page.locator('[data-testid^="draft-track-"]')).toBeVisible();

  await page.getByTestId("commit-loop").click();

  await expect(page.locator('[data-testid^="loop-"]').first()).toBeVisible();
  await expect(page.getByText("Loop 1")).toBeVisible();
});
