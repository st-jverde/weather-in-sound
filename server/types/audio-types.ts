import * as Tone from "tone";

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  transposition: number;
  airPressure: number;
  /** Total precipitation mm (rain, showers, snow, hail, etc. as water equivalent) for the API look-back window */
  rain: number;
  /** 0–100 */
  cloudCover: number;
  /** 1 = day, 0 = night */
  isDay: number;
}

export interface AudioParameters {
  reverbWet: number;
  reverbDecay: number;
  bpm: number;
  baseOctave: number;
}

/** Extended snapshot from weather — single source for all instruments per play. */
export interface CompositionParams extends AudioParameters {
  atmosphereWet: number;
  dayBrightness: number;
}

export interface Note {
  name: string;
  midi: number;
}

export interface WeatherScale {
  notes: string[];
  midiNotes: number[];
  synth: string;
  description: string;
}

export interface Locations {
  city: string;
  lat: number;
  long: number;
}

export const weatherScales: Record<string, WeatherScale> = {
  sunny: {
    notes: ["C", "E", "G", "A", "C", "E", "G", "A"],
    midiNotes: [60, 64, 67, 69, 72, 76, 79, 81],
    synth: "sine",
    description: "Major scale with added 6th - bright and optimistic"
  },
  cloudy: {
    notes: ["C", "Eb", "F", "G", "Bb", "C", "Eb", "F"],
    midiNotes: [60, 63, 65, 67, 70, 72, 75, 77],
    synth: "triangle",
    description: "Minor scale with flat 7th - mellow and contemplative"
  },
  overcast: {
    notes: ["C", "D", "Eb", "G", "Ab", "C", "D", "Eb"],
    midiNotes: [60, 62, 63, 67, 68, 72, 74, 75],
    synth: "square",
    description: "Phrygian mode - dark and mysterious"
  },
  rainy: {
    notes: ["C", "Eb", "F", "G", "Ab", "C", "Eb", "F"],
    midiNotes: [60, 63, 65, 67, 68, 72, 75, 77],
    synth: "sawtooth",
    description: "Minor scale with flat 6th - melancholic"
  },
  snowy: {
    notes: ["C", "D", "F", "G", "A", "C", "D", "F"],
    midiNotes: [60, 62, 65, 67, 69, 72, 74, 77],
    synth: "sine",
    description: "Pentatonic scale - peaceful and floating"
  },
  windy: {
    notes: ["C", "D", "E", "F#", "G#", "A#", "C", "D"],
    midiNotes: [60, 62, 64, 66, 68, 70, 72, 74],
    synth: "sawtooth",
    description: "Whole tone scale - swirling and unstable"
  }
};

export interface NoteData {
  note: string;
  velocity: number;
  silent: boolean;
  /** Tone time notation, e.g. "8n", "4n" */
  duration?: string;
}

export interface BaseInstrument {
  initialize: (destination?: Tone.ToneAudioNode) => Promise<void>;
  start: (weather: WeatherData, params: CompositionParams, location?: Locations) => void;
  stop: () => void;
  cleanup: () => void;
  updatePattern?: (notes: string[] | NoteData[]) => void;
}

export class PatternManager {
  private pattern: Tone.Pattern<string> | null = null;
  private currentNoteData: NoteData[] | null = null;
  private airPressure: number = 1013;
  private humidity: number = 50;
  private notesPlayedInCycle: number = 0;
  private totalNotesInCycle: number = 0;
  private patternStep: number = 0;

  constructor(
    private callback: (time: number, note: string, velocity?: number, duration?: string) => void,
    private interval: string = "8n"
  ) {}

  setAirPressure(pressure: number): void {
    this.airPressure = pressure;
  }

  setHumidity(humidity: number): void {
    this.humidity = humidity;
  }

  create(notes: string[] | NoteData[]): void {
    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
    }

    if (Array.isArray(notes) && notes.length > 0 && typeof notes[0] === "object" && "note" in notes[0]) {
      this.currentNoteData = notes as NoteData[];
    } else {
      this.currentNoteData = null;
    }

    const noteStrings = Array.isArray(notes) && notes.length > 0 && typeof notes[0] === "object" && "note" in notes[0]
      ? (notes as NoteData[]).map((n) => n.note)
      : (notes as string[]);

    this.totalNotesInCycle = noteStrings.length;
    this.notesPlayedInCycle = 0;
    this.patternStep = 0;

    this.pattern = new Tone.Pattern(
      (time, _note) => {
        const idx = this.patternStep % Math.max(1, this.totalNotesInCycle);
        this.patternStep++;

        if (this.currentNoteData) {
          const noteData = this.currentNoteData[idx];
          const note = noteData.note;

          const pressureProbability = Math.max(
            0.2,
            Math.min(0.8, 0.2 + ((this.airPressure - 950) / 100) * 0.6)
          );
          const pressureSkipProbability = 1 - pressureProbability;
          const humiditySkipProbability = Math.pow(1 - this.humidity / 100, 0.5);
          const combinedSkipProbability = Math.max(humiditySkipProbability, pressureSkipProbability);

          const remainingNotes = this.totalNotesInCycle - this.notesPlayedInCycle;
          const needMoreNotes = this.notesPlayedInCycle < 3;
          const notesNeeded = 3 - this.notesPlayedInCycle;

          let shouldPlay = false;
          if (needMoreNotes && remainingNotes <= notesNeeded) {
            shouldPlay = true;
          } else {
            shouldPlay = Math.random() >= combinedSkipProbability;
          }

          if (shouldPlay) {
            this.notesPlayedInCycle++;
            this.callback(time, note, noteData.velocity, noteData.duration);
          }
        } else {
          this.notesPlayedInCycle++;
          this.callback(time, _note);
        }
      },
      noteStrings,
      "up"
    );

    this.pattern.interval = this.interval;
    this.pattern.probability = 1;
  }

  update(notes: string[] | NoteData[]): void {
    if (this.pattern) {
      if (Array.isArray(notes) && notes.length > 0 && typeof notes[0] === "object" && "note" in notes[0]) {
        this.currentNoteData = notes as NoteData[];
      } else {
        this.currentNoteData = null;
      }

      const noteStrings = Array.isArray(notes) && notes.length > 0 && typeof notes[0] === "object" && "note" in notes[0]
        ? (notes as NoteData[]).map((n) => n.note)
        : (notes as string[]);

      this.totalNotesInCycle = noteStrings.length;
      this.notesPlayedInCycle = 0;
      this.patternStep = 0;
      this.pattern.values = noteStrings;
    } else {
      this.create(notes);
    }
  }

  start(): void {
    this.notesPlayedInCycle = 0;
    this.patternStep = 0;
    this.pattern?.start(0);
  }

  stop(): void {
    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
      this.pattern = null;
    }
    this.currentNoteData = null;
  }
}

export class AudioParameterMapper {
  static mapWeatherToParameters(weather: WeatherData): AudioParameters {
    return {
      reverbWet: Math.min(0.8, Math.max(0.2, weather.humidity / 100)),
      reverbDecay: Math.min(8, Math.max(1, weather.humidity / 10)),
      bpm: Math.min(180, Math.max(60, 60 + weather.windSpeed * 2)),
      baseOctave: Math.round(2 + ((weather.temperature + 20) / 60) * 4)
    };
  }

  static getScaleForWeather(weather: WeatherData): WeatherScale {
    const condition = weather.condition.toLowerCase();
    return weatherScales[condition] || weatherScales.sunny;
  }
}
