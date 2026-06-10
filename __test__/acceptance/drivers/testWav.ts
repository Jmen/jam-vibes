// Generates a real PCM WAV in memory: tests exercise the actual upload and
// playback paths with valid audio, no fixture files or ffmpeg needed.
export function makeTestWav(
  durationSeconds = 0.5,
  frequencyHz = 440,
  sampleRate = 8000,
): Buffer {
  const sampleCount = Math.floor(durationSeconds * sampleRate);
  const dataBytes = sampleCount * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < sampleCount; i++) {
    const sample = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
    buffer.writeInt16LE(Math.round(sample * 0.8 * 32767), 44 + i * 2);
  }

  return buffer;
}
