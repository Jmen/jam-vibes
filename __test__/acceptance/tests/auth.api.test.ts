// @vitest-environment node
import { describe, it } from "vitest";
import { ApiDriver } from "../drivers/apiDriver";
import { User } from "../dsl/user";

const driver = new ApiDriver();

describe("authentication", () => {
  it("a new user can register and is signed in", async () => {
    const user = new User(driver);

    await user.registers();
    await user.isSignedIn();
  });

  it("a registered user can sign in", async () => {
    const user = new User(driver);

    await user.registers();
    await user.signsOut();
    await user.signsIn();
  });

  it("signing in with the wrong password is rejected", async () => {
    const user = new User(driver);

    await user.registers();
    await user.cannotSignInWithPassword("not-the-password");
  });

  it("registering the same email twice is rejected", async () => {
    const user = new User(driver);

    await user.registers();
    await user.cannotRegisterAgain();
  });

  it("a signed in user can sign out", async () => {
    const user = new User(driver);

    await user.registers();
    await user.signsOut();
  });

  it("a user can reset a forgotten password from email", async () => {
    const user = new User(driver);

    await user.registers();
    await user.signsOut();

    await user.requestsPasswordReset();
    await user.resetsPasswordFromEmail("brand-new-password-456");

    await user.signsOut();
    await user.signsIn();
  });
});
