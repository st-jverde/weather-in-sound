import { CompositionParams, WeatherData, WeatherScale } from "../types/audio-types";
import { addOctave, clamp, transposeNote } from "./music-utils";

export interface MelodyPartValue {
  note: string;
  duration: string;
  velocity: number;
}

/** Tone.Part events: [transportTime, payload] */
export type MelodyPartEvent = [string, MelodyPartValue];

const DURATIONS_SHORT = ["16n", "16n", "8n"] as const;
const DURATIONS_MIXED = ["16n", "8n", "8n", "4n"] as const;
const DURATIONS_LONG = ["8n", "4n", "4n", "2n"] as const;

/**
 * Two-bar phrase in the current scale, one octave above the lead line,
 * with rests and dynamics driven by wind, clouds, rain, and day/night.
 */
export function buildMelodyPhrase(
  weather: WeatherData,
  scale: WeatherScale,
  params: CompositionParams
): MelodyPartEvent[] {
  const leadOctave = params.baseOctave;
  const melodyOctave = leadOctave + 1;

  const windN = clamp(weather.windSpeed / 40, 0, 1);
  const wetN = clamp((weather.cloudCover / 100) * 0.6 + (weather.rain / 25) * 0.4, 0, 1);
  const sparse = wetN > 0.55 || windN < 0.15;
  const dense = windN > 0.55 && !sparse;

  const numPulses = sparse ? 6 + Math.floor(Math.random() * 4) : dense ? 14 + Math.floor(Math.random() * 6) : 9 + Math.floor(Math.random() * 5);

  const scaleLen = scale.notes.length;
  let degree = Math.floor(Math.random() * scaleLen);
  const events: MelodyPartEvent[] = [];

  const pickDuration = (): string => {
    if (sparse) {
      return DURATIONS_LONG[Math.floor(Math.random() * DURATIONS_LONG.length)];
    }
    if (dense) {
      return DURATIONS_SHORT[Math.floor(Math.random() * DURATIONS_SHORT.length)];
    }
    return DURATIONS_MIXED[Math.floor(Math.random() * DURATIONS_MIXED.length)];
  };

  const restChance = sparse ? 0.35 : dense ? 0.08 : 0.18;
  const stepWind = Math.round(windN * 3) + 1;

  let sixteenthIndex = 0;
  const maxSixteenths = 32;

  for (let p = 0; p < numPulses && sixteenthIndex < maxSixteenths; p++) {
    const dur = pickDuration();
    const durSixteenths =
      dur === "32n"
        ? 0.5
        : dur === "16n"
          ? 1
          : dur === "8n"
            ? 2
            : dur === "4n"
              ? 4
              : dur === "2n"
                ? 8
                : 2;

    if (Math.random() < restChance) {
      sixteenthIndex += durSixteenths;
      continue;
    }

    const bar = Math.floor(sixteenthIndex / 16);
    const rem = sixteenthIndex % 16;
    const beat = Math.floor(rem / 4);
    const six = rem % 4;
    const timeStr = `${bar}:${beat}:${six}`;

    const step = Math.floor(Math.random() * 3) === 0 ? stepWind : Math.random() > 0.45 ? 1 : -1;
    degree = (degree + step + scaleLen * 4) % scaleLen;

    const rawNote = addOctave(scale.notes[degree], melodyOctave);
    const note = transposeNote(rawNote, weather.transposition);

    const phraseT = p / Math.max(1, numPulses - 1);
    const accent = 0.55 + 0.45 * Math.cos(phraseT * Math.PI);
    const velBase = (0.35 + params.dayBrightness * 0.35) * (1 - wetN * 0.25);
    const velocity = clamp(velBase * accent + (Math.random() - 0.5) * 0.12, 0.15, 0.95);

    events.push([timeStr, { note, duration: dur, velocity }]);

    sixteenthIndex += durSixteenths;
  }

  if (events.length === 0) {
    const n = transposeNote(addOctave(scale.notes[0], melodyOctave), weather.transposition);
    events.push(["0:0:0", { note: n, duration: "2n", velocity: 0.5 * params.dayBrightness }]);
  }

  return events.sort((a, b) => {
    const ta = transportSixteenthIndex(a[0]);
    const tb = transportSixteenthIndex(b[0]);
    return ta - tb;
  });
}

function transportSixteenthIndex(s: string): number {
  const parts = s.split(":").map(Number);
  const [bar = 0, beat = 0, six = 0] = parts;
  return bar * 16 + beat * 4 + six;
}
