import { expect } from "vitest";
import { ApiDriver, ApiContext } from "../drivers/apiDriver";
import { ApiError } from "@/lib/api";
import { JamSummary } from "@/app/api/jams/schema";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

// DSL: jam interactions from the perspective of a signed-in user
export class Jams {
  constructor(
    private readonly driver: ApiDriver,
    private readonly context: ApiContext,
  ) {}

  private client() {
    return this.driver.client(this.context);
  }

  async creates(
    name: string,
    options: { description?: string; access?: "private" | "public" } = {},
  ): Promise<JamSummary> {
    const jam = await this.client().jams.create({
      name,
      description: options.description ?? "",
      access: options.access ?? "private",
    });

    expect(jam.id).toBeTruthy();
    expect(jam.humanId).toBeTruthy();

    return jam;
  }

  async appearsInMyJams(jamId: string): Promise<void> {
    const jams = await this.client().jams.listMine();

    expect(jams.find((jam) => jam.id === jamId)).toBeTruthy();
  }

  async canView(idOrHumanId: string): Promise<void> {
    const jam = await this.client().jams.get(idOrHumanId);

    expect(jam.id).toBeTruthy();
  }

  async cannotView(idOrHumanId: string): Promise<void> {
    await expect(this.client().jams.get(idOrHumanId)).rejects.toThrowError(
      ApiError,
    );
  }

  async makesPublic(jamId: string): Promise<void> {
    const jam = await this.client().jams.update(jamId, { access: "public" });

    expect(jam.access).toBe("public");
  }

  async makesPrivate(jamId: string): Promise<void> {
    const jam = await this.client().jams.update(jamId, { access: "private" });

    expect(jam.access).toBe("private");
  }

  async cannotChangeVisibility(jamId: string): Promise<void> {
    await expect(
      this.client().jams.update(jamId, { access: "public" }),
    ).rejects.toThrowError(ApiError);
  }

  async accessIs(
    idOrHumanId: string,
    expected: "private" | "public",
  ): Promise<void> {
    const jam = await this.client().jams.get(idOrHumanId);

    expect(jam.access).toBe(expected);
  }

  async uploadsPhoto(jamId: string): Promise<void> {
    const file = new Blob([new Uint8Array(TINY_PNG)], { type: "image/png" });

    const jam = await this.client().jams.uploadPhoto(jamId, file);

    expect(jam.photoUrl).toBeTruthy();
  }

  async cannotUploadPhoto(jamId: string): Promise<void> {
    const file = new Blob([new Uint8Array(TINY_PNG)], { type: "image/png" });

    await expect(
      this.client().jams.uploadPhoto(jamId, file),
    ).rejects.toThrowError(ApiError);
  }

  async photoIsServed(idOrHumanId: string): Promise<void> {
    const jam = await this.client().jams.get(idOrHumanId);

    expect(jam.photoUrl).toBeTruthy();

    const response = await fetch(jam.photoUrl!);

    expect(response.status).toBe(200);
  }
}

// DSL: the anonymous visitor's perspective — no credentials at all
export class Visitor {
  constructor(private readonly driver: ApiDriver) {}

  private client() {
    return this.driver.client();
  }

  async seesPublicJam(jamId: string): Promise<void> {
    const jams = await this.client().jams.listPublic();

    expect(jams.find((jam) => jam.id === jamId)).toBeTruthy();
  }

  async doesNotSeePublicJam(jamId: string): Promise<void> {
    const jams = await this.client().jams.listPublic();

    expect(jams.find((jam) => jam.id === jamId)).toBeFalsy();
  }

  async canViewJam(idOrHumanId: string): Promise<void> {
    const jam = await this.client().jams.get(idOrHumanId);

    expect(jam.id).toBeTruthy();
  }

  async cannotViewJam(idOrHumanId: string): Promise<void> {
    await expect(this.client().jams.get(idOrHumanId)).rejects.toThrowError(
      ApiError,
    );
  }
}
