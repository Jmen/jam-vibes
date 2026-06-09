import { expect } from "vitest";
import { ApiDriver, ApiContext } from "../drivers/apiDriver";
import { ApiError } from "@/lib/api";
import { findLatestEmailTo, extractRecoveryTokenHash } from "../drivers/mailpit";

let uniqueCounter = 0;

// DSL: a person interacting with the application. Test scenarios read as
// actions this user takes, with no protocol details.
export class User {
  readonly context: ApiContext;

  constructor(
    private readonly driver: ApiDriver,
    name = "user",
  ) {
    uniqueCounter += 1;
    this.context = {
      email: `${name}-${Date.now()}-${uniqueCounter}@example.com`,
      password: "initial-password-123",
    };
  }

  async registers(): Promise<void> {
    const session = await this.driver.auth.register(this.context);

    expect(session.userId).toBeTruthy();
    expect(session.accessToken).toBeTruthy();
  }

  async cannotRegisterAgain(): Promise<void> {
    await expect(this.driver.auth.register(this.context)).rejects.toThrowError(
      ApiError,
    );
  }

  async signsIn(): Promise<void> {
    const session = await this.driver.auth.signIn(this.context);

    expect(session.userId).toBeTruthy();
    expect(session.accessToken).toBeTruthy();
  }

  async cannotSignInWithPassword(wrongPassword: string): Promise<void> {
    const attempt = { ...this.context, password: wrongPassword };

    await expect(this.driver.auth.signIn(attempt)).rejects.toThrowError(
      ApiError,
    );
  }

  async signsOut(): Promise<void> {
    await this.driver.auth.signOut(this.context);

    expect(this.context.accessToken).toBeUndefined();
  }

  async isSignedIn(): Promise<void> {
    expect(this.context.accessToken).toBeTruthy();
  }

  async requestsPasswordReset(): Promise<void> {
    await this.driver.auth.forgotPassword(this.context);
  }

  async resetsPasswordFromEmail(newPassword: string): Promise<void> {
    const emailBody = await findLatestEmailTo(this.context.email);
    const tokenHash = extractRecoveryTokenHash(emailBody);

    const session = await this.driver.auth.resetPassword(
      this.context,
      tokenHash,
      newPassword,
    );

    expect(session.accessToken).toBeTruthy();
  }
}
