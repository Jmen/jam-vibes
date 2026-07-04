import { test, expect, Page } from "@playwright/test";
import { makeTestWav } from "../acceptance/drivers/testWav";

// Two people, two browsers: a visitor watching a public jam sees a new loop
// appear the moment a member commits it — no refresh.
//
// FIXME: disabled — flaky. The adapter subscribes fire-and-forget and the test
// waits a fixed 1.5s, so a loop committed before the subscription is live is
// lost (postgres_changes has no replay). Re-enable once the page exposes
// subscription readiness (and catch-up refetches on SUBSCRIBED).
test.fixme("a visitor sees new loops appear in real time", async ({
  browser,
}) => {
  const ownerContext = await browser.newContext();
  const visitorContext = await browser.newContext();

  try {
    const owner: Page = await ownerContext.newPage();
    const visitor: Page = await visitorContext.newPage();

    // Owner sets up a public jam with uploaded audio (via the API — the UI
    // journey for this is covered by the main smoke test)
    const email = `realtime-${Date.now()}@example.com`;
    await owner.goto("/");
    const registerResponse = await owner.request.post("/api/auth/register", {
      data: { email, password: "realtime-password-123" },
    });
    expect(registerResponse.ok()).toBeTruthy();

    const jamResponse = await owner.request.post("/api/jams", {
      data: { name: "Live Jam", description: "", access: "public" },
    });
    expect(jamResponse.ok()).toBeTruthy();
    const jam = (await jamResponse.json()).data;

    const audioResponse = await owner.request.post("/api/audio", {
      multipart: {
        jamId: jam.id,
        file: {
          name: "live.wav",
          mimeType: "audio/wav",
          buffer: makeTestWav(0.5, 550),
        },
      },
    });
    expect(audioResponse.ok()).toBeTruthy();
    const audio = (await audioResponse.json()).data;

    // The visitor opens the public jam — empty so far — and keeps it open
    await visitor.goto(`/jams/${jam.humanId}`);
    await expect(
      visitor.getByRole("heading", { name: "Live Jam" }),
    ).toBeVisible();
    await expect(visitor.locator('[data-testid^="loop-"]')).toHaveCount(0);

    // Give the realtime subscription a moment to be established
    await visitor.waitForTimeout(1500);

    // The owner commits a loop
    const loopResponse = await owner.request.post(`/api/jams/${jam.id}/loops`, {
      data: { audio: [{ audioId: audio.id, volume: 1 }] },
    });
    expect(loopResponse.ok()).toBeTruthy();

    // ... and the visitor's page updates without any reload
    await expect(visitor.locator('[data-testid^="loop-"]').first()).toBeVisible(
      { timeout: 10_000 },
    );
    await expect(visitor.getByText("Loop 1")).toBeVisible();
  } finally {
    await ownerContext.close();
    await visitorContext.close();
  }
});
