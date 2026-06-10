import { expect } from "vitest";
import { ApiDriver, ApiContext } from "../drivers/apiDriver";
import { ApiError } from "@/lib/api";

// A 1x1 transparent PNG, enough to exercise the real upload path
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export class Profile {
  constructor(
    private readonly driver: ApiDriver,
    private readonly context: ApiContext,
  ) {}

  private client() {
    return this.driver.client(this.context);
  }

  // e.g. "brave-walrus-x4f2", the shape generate_username() produces
  async isBornWithGeneratedUsername(): Promise<void> {
    const profile = await this.client().my.profile.get();

    expect(profile.username).toMatch(/^[a-z]+-[a-z]+-[a-z0-9]{4}$/);
    expect(profile.avatarUrl).toBeNull();
    expect(profile.email).toBe(this.context.email);
  }

  async username(): Promise<string> {
    const profile = await this.client().my.profile.get();

    expect(profile.username).toBeTruthy();
    return profile.username!;
  }

  async picksUsername(username: string): Promise<void> {
    const profile = await this.client().my.profile.update({ username });

    expect(profile.username).toBe(username);
  }

  async cannotPickUsername(username: string): Promise<void> {
    await expect(
      this.client().my.profile.update({ username }),
    ).rejects.toThrowError(ApiError);
  }

  async uploadsAvatar(): Promise<void> {
    const file = new Blob([new Uint8Array(TINY_PNG)], { type: "image/png" });

    const profile = await this.client().my.profile.uploadAvatar(file);

    expect(profile.avatarUrl).toBeTruthy();
  }

  async avatarIsServed(): Promise<void> {
    const profile = await this.client().my.profile.get();

    expect(profile.avatarUrl).toBeTruthy();

    const response = await fetch(profile.avatarUrl!);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/");
  }

  async usernameIs(expected: string): Promise<void> {
    const profile = await this.client().my.profile.get();

    expect(profile.username).toBe(expected);
  }
}
