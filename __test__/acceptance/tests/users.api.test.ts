// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ApiDriver } from "../drivers/apiDriver";
import { User } from "../dsl/user";
import { Profile } from "../dsl/profile";

const driver = new ApiDriver();

describe("user profiles", () => {
  it("a new user is born with a generated username", async () => {
    const user = new User(driver);
    await user.registers();

    const profile = new Profile(driver, user.context);
    await profile.isBornWithGeneratedUsername();
  });

  it("simultaneous signups each get a distinct username", async () => {
    const users = Array.from(
      { length: 6 },
      (_, i) => new User(driver, `racer-${i}`),
    );
    await Promise.all(users.map((user) => user.registers()));

    const usernames = await Promise.all(
      users.map((user) => new Profile(driver, user.context).username()),
    );

    expect(new Set(usernames).size).toBe(users.length);
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
