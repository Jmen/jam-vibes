// @vitest-environment node
import { describe, it } from "vitest";
import { ApiDriver } from "../drivers/apiDriver";
import { User } from "../dsl/user";
import { Profile } from "../dsl/profile";

const driver = new ApiDriver();

describe("user profiles", () => {
  it("a new user starts with an empty profile", async () => {
    const user = new User(driver);
    await user.registers();

    const profile = new Profile(driver, user.context);
    await profile.isEmpty();
  });

  it("a user can pick a username", async () => {
    const user = new User(driver);
    await user.registers();

    const profile = new Profile(driver, user.context);
    const username = `player-${Date.now()}`;

    await profile.picksUsername(username);
    await profile.usernameIs(username);
  });

  it("usernames are unique across users", async () => {
    const first = new User(driver, "first");
    const second = new User(driver, "second");
    await first.registers();
    await second.registers();

    const username = `taken-${Date.now()}`;

    await new Profile(driver, first.context).picksUsername(username);
    await new Profile(driver, second.context).cannotPickUsername(username);
  });

  it("a user can upload a profile photo and it is served publicly", async () => {
    const user = new User(driver);
    await user.registers();

    const profile = new Profile(driver, user.context);

    await profile.uploadsAvatar();
    await profile.avatarIsServed();
  });
});
