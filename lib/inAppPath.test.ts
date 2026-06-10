import { describe, it, expect } from "vitest";
import { toInAppPath } from "./inAppPath";

describe("toInAppPath", () => {
  it("keeps in-app paths, including query and hash", () => {
    expect(toInAppPath("/jams/42")).toBe("/jams/42");
    expect(toInAppPath("/invites/accept?code=abc#top")).toBe(
      "/invites/accept?code=abc#top",
    );
  });

  it("defaults to home when next is missing", () => {
    expect(toInAppPath(null)).toBe("/");
    expect(toInAppPath("")).toBe("/");
  });

  it("refuses absolute and protocol-relative destinations", () => {
    expect(toInAppPath("https://evil.example")).toBe("/");
    expect(toInAppPath("//evil.example/jams")).toBe("/");
    expect(toInAppPath("javascript:alert(1)")).toBe("/");
  });

  it("refuses backslash variants, which URL parsing reads as slashes", () => {
    expect(toInAppPath("/\\evil.example")).toBe("/");
    expect(toInAppPath("\\/evil.example")).toBe("/");
    expect(toInAppPath("\\\\evil.example")).toBe("/");
    expect(toInAppPath("/\\/evil.example")).toBe("/");
  });
});
