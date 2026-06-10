import { ErrorCode, Result, ok, err } from "../../result";
import { JamView, LoopView } from "./schema";

export interface AudioRef {
  id: string;
  filePath: string;
  fileName: string | null;
}

export interface LoopAudioRecord {
  id: string;
  audio: AudioRef;
  position: number;
  volume: number;
}

export interface LoopRecord {
  id: string;
  createdAt: string;
  parentId: string | null;
  ownerUsername: string | null;
  audio: LoopAudioRecord[];
}

export interface SignedUrl {
  path: string;
  url: string;
}

// Domain object: a jam aggregates loops and their audio; rendering a view
// requires every storage path to have been resolved to a playable URL.
export class Jam {
  constructor(
    private readonly props: {
      id: string;
      humanId: string;
      name: string;
      description: string;
      access: string;
      createdAt: string;
      ownerId: string;
      ownerUsername: string | null;
      photoPath: string | null;
      loops: LoopRecord[];
    },
  ) {}

  storagePaths(): string[] {
    return this.props.loops.flatMap((loop) =>
      loop.audio.map((loopAudio) => loopAudio.audio.filePath),
    );
  }

  photoPath(): string | null {
    return this.props.photoPath;
  }

  ownerId(): string {
    return this.props.ownerId;
  }

  id(): string {
    return this.props.id;
  }

  viewWithUrls(
    audioUrls: SignedUrl[],
    photoUrl: string | null,
    viewerRole: JamView["viewerRole"],
  ): Result<JamView> {
    const loops: LoopView[] = [];

    for (const loop of this.props.loops) {
      const audio = [];

      for (const loopAudio of loop.audio) {
        const signed = audioUrls.find(
          (candidate) => candidate.path === loopAudio.audio.filePath,
        );

        if (!signed) {
          return err(
            "audio_url_missing",
            `No playable URL for audio ${loopAudio.audio.id}`,
            ErrorCode.SERVER_ERROR,
          );
        }

        audio.push({
          id: loopAudio.id,
          audioId: loopAudio.audio.id,
          url: signed.url,
          fileName: loopAudio.audio.fileName,
          position: loopAudio.position,
          volume: loopAudio.volume,
        });
      }

      audio.sort((a, b) => a.position - b.position);

      loops.push({
        id: loop.id,
        createdAt: loop.createdAt,
        parentId: loop.parentId,
        ownerUsername: loop.ownerUsername,
        audio,
      });
    }

    return ok({
      id: this.props.id,
      humanId: this.props.humanId,
      name: this.props.name,
      description: this.props.description,
      access: this.props.access as JamView["access"],
      createdAt: this.props.createdAt,
      ownerId: this.props.ownerId,
      ownerUsername: this.props.ownerUsername,
      photoUrl,
      viewerRole,
      loops,
    });
  }
}
