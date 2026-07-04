import { test, expect } from "@playwright/test";
import { makeTestWav } from "../acceptance/drivers/testWav";

// Playing and switching loops exercises the shared audio provider in a real
// browser with React StrictMode — the layer where render-phase setState bugs
// surface (jsdom's eager-state path cannot reproduce them).
test("playing and switching loops keeps the console clean", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  // A public jam with two loops, set up via the API
  const email = `playback-${Date.now()}@example.com`;
  await page.goto("/");
  const registerResponse = await page.request.post("/api/auth/register", {
    data: { email, password: "playback-password-123" },
  });
  expect(registerResponse.ok()).toBeTruthy();

  const jamResponse = await page.request.post("/api/jams", {
    data: { name: "Playback Jam", description: "", access: "public" },
  });
  const jam = (await jamResponse.json()).data;

  for (const frequency of [220, 440]) {
    const audioResponse = await page.request.post("/api/audio", {
      multipart: {
        jamId: jam.id,
        file: {
          name: `tone-${frequency}.wav`,
          mimeType: "audio/wav",
          buffer: makeTestWav(0.5, frequency),
        },
      },
    });
    const audio = (await audioResponse.json()).data;

    const loopResponse = await page.request.post(`/api/jams/${jam.id}/loops`, {
      data: { audio: [{ audioId: audio.id, volume: 1 }] },
    });
    expect(loopResponse.ok()).toBeTruthy();
  }

  await page.goto(`/jams/${jam.humanId}`);

  // Play loop 1, switch straight to loop 2 (stops loop 1), then stop
  await page.getByRole("button", { name: "Play loop 1" }).click();
  await expect(page.getByRole("button", { name: "Stop loop 1" })).toBeVisible();

  await page.getByRole("button", { name: "Play loop 2" }).click();
  await expect(page.getByRole("button", { name: "Stop loop 2" })).toBeVisible();
  // Switching must have stopped loop 1
  await expect(page.getByRole("button", { name: "Play loop 1" })).toBeVisible();

  await page.getByRole("button", { name: "Stop loop 2" }).click();
  await expect(page.getByRole("button", { name: "Play loop 2" })).toBeVisible();

  const reactWarnings = consoleErrors.filter(
    (text) =>
      text.includes("Cannot update a component") || text.includes("Warning:"),
  );
  expect(reactWarnings).toEqual([]);
});
