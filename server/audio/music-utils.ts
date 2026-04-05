/** Shared note / pitch helpers for instruments. */

export function addOctave(note: string, octave: number): string {
  const baseNote = note.replace(/\d+$/, "");
  return `${baseNote}${octave}`;
}

export function transposeNote(note: string, semitones: number): string {
  const match = note.match(/^([A-Ga-g]#?b?)(\d+)$/);
  if (!match) return note;

  const [, notePart, octavePart] = match;
  let octave = parseInt(octavePart, 10);

  const chromaticScale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const noteIndex = chromaticScale.indexOf(notePart);
  if (noteIndex === -1) return note;

  let newIndex = noteIndex + semitones;

  while (newIndex < 0) {
    newIndex += chromaticScale.length;
    octave -= 1;
  }
  while (newIndex >= chromaticScale.length) {
    newIndex -= chromaticScale.length;
    octave += 1;
  }

  return chromaticScale[newIndex] + octave;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
