import { expect } from "vitest";
import { ApiDriver, ApiContext } from "../drivers/apiDriver";
import { ApiError } from "@/lib/api";

export class Invites {
  constructor(
    private readonly driver: ApiDriver,
    private readonly context: ApiContext,
  ) {}

  private client() {
    return this.driver.client(this.context);
  }

  async invites(jamId: string, email: string): Promise<string> {
    const invite = await this.client().jams.createInvite(jamId, { email });

    expect(invite.token).toBeTruthy();

    return invite.token;
  }

  async cannotInvite(jamId: string, email: string): Promise<void> {
    await expect(
      this.client().jams.createInvite(jamId, { email }),
    ).rejects.toThrowError(ApiError);
  }

  async accepts(token: string): Promise<string> {
    const result = await this.client().invites.accept({ token });

    expect(result.jamId).toBeTruthy();

    return result.jamId;
  }

  async cannotAccept(token: string): Promise<void> {
    await expect(
      this.client().invites.accept({ token }),
    ).rejects.toThrowError(ApiError);
  }

  async invitesListShows(jamId: string, email: string): Promise<void> {
    const invites = await this.client().jams.listInvites(jamId);

    expect(invites.find((invite) => invite.email === email)).toBeTruthy();
  }
}
