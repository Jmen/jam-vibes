import { expect } from "vitest";
import { ApiDriver, ApiContext } from "../drivers/apiDriver";
import { ApiError } from "@/lib/api";
import { AudioView } from "@/app/api/audio/schema";
import { makeTestWav } from "../drivers/testWav";

// DSL: uploading audio and committing loops, from a signed-in user's view
export class Audio {
  constructor(
    private readonly driver: ApiDriver,
    private readonly context: ApiContext,
  ) {}

  private client() {
    return this.driver.client(this.context);
  }

  async uploads(
    jamId: string,
    options: { fileName?: string; frequencyHz?: number } = {},
  ): Promise<AudioView> {
    const wav = makeTestWav(0.5, options.frequencyHz ?? 440);
    const file = new Blob([new Uint8Array(wav)], { type: "audio/wav" });

    const audio = await this.client().audio.upload(
      jamId,
      file,
      options.fileName ?? "track.wav",
    );

    expect(audio.id).toBeTruthy();
    expect(audio.url).toBeTruthy();

    return audio;
  }

  async cannotUpload(jamId: string): Promise<void> {
    const wav = makeTestWav();
    const file = new Blob([new Uint8Array(wav)], { type: "audio/wav" });

    await expect(this.client().audio.upload(jamId, file)).rejects.toThrowError(
      ApiError,
    );
  }

  async listForJamIncludes(jamId: string, audioId: string): Promise<void> {
    const list = await this.client().audio.listMine(jamId);

    expect(list.find((audio) => audio.id === audioId)).toBeTruthy();
  }

  async commitsLoop(
    jamId: string,
    tracks: { audioId: string; volume?: number }[],
    parentId?: string,
  ): Promise<string> {
    const loop = await this.client().jams.addLoop(jamId, {
      parentId,
      audio: tracks.map((track) => ({
        audioId: track.audioId,
        volume: track.volume ?? 1,
      })),
    });

    expect(loop.id).toBeTruthy();

    return loop.id;
  }

  async cannotCommitLoop(
    jamId: string,
    tracks: { audioId: string }[],
  ): Promise<void> {
    await expect(
      this.client().jams.addLoop(jamId, {
        audio: tracks.map((track) => ({ audioId: track.audioId, volume: 1 })),
      }),
    ).rejects.toThrowError(ApiError);
  }

  async loopAtPositionHasTracks(
    jamIdOrHumanId: string,
    position: number,
    expected: { audioId: string; volume?: number }[],
  ): Promise<void> {
    const jam = await this.client().jams.get(jamIdOrHumanId);

    const loop = jam.loops[position];
    expect(loop).toBeTruthy();
    expect(loop.audio).toHaveLength(expected.length);

    expected.forEach((expectedTrack, index) => {
      const track = loop.audio[index];
      expect(track.audioId).toBe(expectedTrack.audioId);
      if (expectedTrack.volume !== undefined) {
        expect(track.volume).toBeCloseTo(expectedTrack.volume, 5);
      }
    });
  }

  async loopAtPositionHasParent(
    jamIdOrHumanId: string,
    position: number,
    parentLoopId: string,
  ): Promise<void> {
    const jam = await this.client().jams.get(jamIdOrHumanId);

    expect(jam.loops[position]?.parentId).toBe(parentLoopId);
  }

  async loopAudioIsPlayable(
    jamIdOrHumanId: string,
    position: number,
  ): Promise<void> {
    const jam = await this.client().jams.get(jamIdOrHumanId);

    const loop = jam.loops[position];
    expect(loop).toBeTruthy();
    expect(loop.audio.length).toBeGreaterThan(0);

    for (const track of loop.audio) {
      const response = await fetch(track.url);

      expect(response.status).toBe(200);

      const bytes = await response.arrayBuffer();
      // Real WAV content survived the round trip, not just a 200
      expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
    }
  }
}
