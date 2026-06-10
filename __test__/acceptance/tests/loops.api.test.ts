// @vitest-environment node
import { describe, it } from "vitest";
import { ApiDriver } from "../drivers/apiDriver";
import { User } from "../dsl/user";
import { Jams, Visitor } from "../dsl/jams";
import { Audio } from "../dsl/audio";

const driver = new ApiDriver();

describe("audio and loops", () => {
  it("a member can upload audio to their jam", async () => {
    const user = new User(driver);
    await user.registers();

    const jam = await new Jams(driver, user.context).creates("Audio Jam");

    const audio = new Audio(driver, user.context);
    const track = await audio.uploads(jam.id);

    await audio.listForJamIncludes(jam.id, track.id);
  });

  it("uploaded audio can be committed as a loop and played back", async () => {
    const user = new User(driver);
    await user.registers();

    const jam = await new Jams(driver, user.context).creates("Loop Jam");

    const audio = new Audio(driver, user.context);
    const drums = await audio.uploads(jam.id, {
      fileName: "drums.wav",
      frequencyHz: 220,
    });
    const bass = await audio.uploads(jam.id, {
      fileName: "bass.wav",
      frequencyHz: 110,
    });

    await audio.commitsLoop(jam.id, [
      { audioId: drums.id },
      { audioId: bass.id },
    ]);

    await audio.loopAtPositionHasTracks(jam.id, 0, [
      { audioId: drums.id },
      { audioId: bass.id },
    ]);
    await audio.loopAudioIsPlayable(jam.id, 0);
  });

  it("a committed loop preserves each track's volume", async () => {
    const user = new User(driver);
    await user.registers();

    const jam = await new Jams(driver, user.context).creates("Mix Jam");

    const audio = new Audio(driver, user.context);
    const quiet = await audio.uploads(jam.id);
    const loud = await audio.uploads(jam.id);

    await audio.commitsLoop(jam.id, [
      { audioId: quiet.id, volume: 0.25 },
      { audioId: loud.id, volume: 1 },
    ]);

    await audio.loopAtPositionHasTracks(jam.id, 0, [
      { audioId: quiet.id, volume: 0.25 },
      { audioId: loud.id, volume: 1 },
    ]);
  });

  it("loops record their lineage when committed on top of a parent", async () => {
    const user = new User(driver);
    await user.registers();

    const jam = await new Jams(driver, user.context).creates("History Jam");

    const audio = new Audio(driver, user.context);
    const first = await audio.uploads(jam.id);
    const second = await audio.uploads(jam.id);

    const parentLoopId = await audio.commitsLoop(jam.id, [
      { audioId: first.id },
    ]);

    await audio.commitsLoop(
      jam.id,
      [{ audioId: first.id }, { audioId: second.id }],
      parentLoopId,
    );

    await audio.loopAtPositionHasParent(jam.id, 1, parentLoopId);
  });

  it("a non-member cannot upload audio or commit loops to someone else's jam", async () => {
    const owner = new User(driver, "owner");
    const intruder = new User(driver, "intruder");
    await owner.registers();
    await intruder.registers();

    const jam = await new Jams(driver, owner.context).creates("Private Jam");

    const ownerAudio = new Audio(driver, owner.context);
    const track = await ownerAudio.uploads(jam.id);

    const intruderAudio = new Audio(driver, intruder.context);
    await intruderAudio.cannotUpload(jam.id);
    await intruderAudio.cannotCommitLoop(jam.id, [{ audioId: track.id }]);
  });

  it("a visitor can listen to loops in a public jam", async () => {
    const owner = new User(driver, "owner");
    await owner.registers();

    const jams = new Jams(driver, owner.context);
    const jam = await jams.creates("Street Performance", {
      access: "public",
    });

    const audio = new Audio(driver, owner.context);
    const track = await audio.uploads(jam.id);
    await audio.commitsLoop(jam.id, [{ audioId: track.id }]);

    const visitor = new Visitor(driver);
    await visitor.canViewJam(jam.id);

    // The visitor plays the public jam's audio without an account
    const visitorAudio = new Audio(driver, {
      email: "",
      password: "",
    });
    await visitorAudio.loopAudioIsPlayable(jam.id, 0);
  });
});
