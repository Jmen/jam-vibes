// @vitest-environment node
import { describe, it } from "vitest";
import { ApiDriver } from "../drivers/apiDriver";
import { User } from "../dsl/user";
import { Jams, Visitor } from "../dsl/jams";

const driver = new ApiDriver();

describe("jams", () => {
  it("a user can create a jam and see it in their jams", async () => {
    const user = new User(driver);
    await user.registers();

    const jams = new Jams(driver, user.context);
    const jam = await jams.creates("My First Jam");

    await jams.appearsInMyJams(jam.id);
  });

  it("a jam can be fetched by its human readable id", async () => {
    const user = new User(driver);
    await user.registers();

    const jams = new Jams(driver, user.context);
    const jam = await jams.creates("Readable Jam");

    await jams.canView(jam.humanId);
  });

  it("new jams are private: hidden from visitors and other users", async () => {
    const owner = new User(driver, "owner");
    const other = new User(driver, "other");
    await owner.registers();
    await other.registers();

    const jam = await new Jams(driver, owner.context).creates("Secret Jam");

    const visitor = new Visitor(driver);
    await visitor.doesNotSeePublicJam(jam.id);
    await visitor.cannotViewJam(jam.id);

    await new Jams(driver, other.context).cannotView(jam.id);
  });

  it("making a jam public puts it on the public feed for visitors", async () => {
    const owner = new User(driver, "owner");
    await owner.registers();

    const jams = new Jams(driver, owner.context);
    const jam = await jams.creates("Street Jam");

    await jams.makesPublic(jam.id);

    const visitor = new Visitor(driver);
    await visitor.seesPublicJam(jam.id);
    await visitor.canViewJam(jam.id);
  });

  it("only the owner can change a jam's visibility", async () => {
    const owner = new User(driver, "owner");
    const intruder = new User(driver, "intruder");
    await owner.registers();
    await intruder.registers();

    const ownerJams = new Jams(driver, owner.context);
    const jam = await ownerJams.creates("Locked Jam", { access: "public" });

    await new Jams(driver, intruder.context).cannotChangeVisibility(jam.id);
    await ownerJams.accessIs(jam.id, "public");
  });

  it("the owner can add a photo to a jam and it is served", async () => {
    const owner = new User(driver, "owner");
    await owner.registers();

    const jams = new Jams(driver, owner.context);
    const jam = await jams.creates("Photo Jam");

    await jams.uploadsPhoto(jam.id);
    await jams.photoIsServed(jam.id);
  });

  it("a non-owner cannot add a photo to someone else's jam", async () => {
    const owner = new User(driver, "owner");
    const intruder = new User(driver, "intruder");
    await owner.registers();
    await intruder.registers();

    const jam = await new Jams(driver, owner.context).creates("My Jam", {
      access: "public",
    });

    await new Jams(driver, intruder.context).cannotUploadPhoto(jam.id);
  });
});
