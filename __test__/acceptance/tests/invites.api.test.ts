// @vitest-environment node
import { describe, it } from "vitest";
import { ApiDriver } from "../drivers/apiDriver";
import { User } from "../dsl/user";
import { Jams } from "../dsl/jams";
import { Audio } from "../dsl/audio";
import { Invites } from "../dsl/invites";

const driver = new ApiDriver();

describe("invites to private jams", () => {
  it("an invited user can accept and view the private jam", async () => {
    const owner = new User(driver, "owner");
    const friend = new User(driver, "friend");
    await owner.registers();
    await friend.registers();

    const jam = await new Jams(driver, owner.context).creates("Band Practice");

    const friendJams = new Jams(driver, friend.context);
    await friendJams.cannotView(jam.id);

    const token = await new Invites(driver, owner.context).invites(
      jam.id,
      friend.context.email,
    );

    await new Invites(driver, friend.context).accepts(token);

    await friendJams.canView(jam.id);
    await friendJams.appearsInMyJams(jam.id);
  });

  it("an invited member can upload audio and commit loops", async () => {
    const owner = new User(driver, "owner");
    const friend = new User(driver, "friend");
    await owner.registers();
    await friend.registers();

    const jam = await new Jams(driver, owner.context).creates("Collab Jam");

    const token = await new Invites(driver, owner.context).invites(
      jam.id,
      friend.context.email,
    );
    await new Invites(driver, friend.context).accepts(token);

    const friendAudio = new Audio(driver, friend.context);
    const track = await friendAudio.uploads(jam.id);
    await friendAudio.commitsLoop(jam.id, [{ audioId: track.id }]);

    await friendAudio.loopAtPositionHasTracks(jam.id, 0, [
      { audioId: track.id },
    ]);
  });

  it("only the owner can send invites", async () => {
    const owner = new User(driver, "owner");
    const other = new User(driver, "other");
    await owner.registers();
    await other.registers();

    const jam = await new Jams(driver, owner.context).creates("Owner Only", {
      access: "public",
    });

    await new Invites(driver, other.context).cannotInvite(
      jam.id,
      "someone@example.com",
    );
  });

  it("the owner can see their sent invites", async () => {
    const owner = new User(driver, "owner");
    await owner.registers();

    const jam = await new Jams(driver, owner.context).creates("Invite List");

    const invites = new Invites(driver, owner.context);
    await invites.invites(jam.id, "drummer@example.com");
    await invites.invitesListShows(jam.id, "drummer@example.com");
  });

  it("an invalid token is rejected", async () => {
    const user = new User(driver);
    await user.registers();

    await new Invites(driver, user.context).cannotAccept(
      "00000000-0000-0000-0000-000000000000",
    );
  });

  it("an invite can only be used once", async () => {
    const owner = new User(driver, "owner");
    const first = new User(driver, "first");
    const second = new User(driver, "second");
    await owner.registers();
    await first.registers();
    await second.registers();

    const jam = await new Jams(driver, owner.context).creates("One Seat");

    const token = await new Invites(driver, owner.context).invites(
      jam.id,
      first.context.email,
    );

    await new Invites(driver, first.context).accepts(token);
    await new Invites(driver, second.context).cannotAccept(token);
  });
});
