import * as Tone from "tone";

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export interface AudioParameters {
  reverbWet: number;
  reverbDecay: number;
  bpm: number;
  baseOctave: number;
}

export interface Note {
  name: string;
  midi: number;
}

export interface WeatherScale {
  notes: string[];
  midiNotes: number[];
  description: string;
}

export interface Locations {
  city: string;
  lat: string;
  long: string;
}

export const weatherScales: Record<string, WeatherScale> = {
  sunny: {
    notes: ["C", "E", "G", "A", "C", "E", "G", "A"],
    midiNotes: [60, 64, 67, 69, 72, 76, 79, 81],
    description: "Major scale with added 6th - bright and optimistic"
  },
  cloudy: {
    notes: ["C", "Eb", "F", "G", "Bb", "C", "Eb", "F"],
    midiNotes: [60, 63, 65, 67, 70, 72, 75, 77],
    description: "Minor scale with flat 7th - mellow and contemplative"
  },
  overcast: {
    notes: ["C", "D", "Eb", "G", "Ab", "C", "D", "Eb"],
    midiNotes: [60, 62, 63, 67, 68, 72, 74, 75],
    description: "Phrygian mode - dark and mysterious"
  },
  rainy: {
    notes: ["C", "Eb", "F", "G", "Ab", "C", "Eb", "F"],
    midiNotes: [60, 63, 65, 67, 68, 72, 75, 77],
    description: "Minor scale with flat 6th - melancholic"
  },
  snowy: {
    notes: ["C", "D", "F", "G", "A", "C", "D", "F"],
    midiNotes: [60, 62, 65, 67, 69, 72, 74, 77],
    description: "Pentatonic scale - peaceful and floating"
  },
  windy: {
    notes: ["C", "D", "E", "F#", "G#", "A#", "C", "D"],
    midiNotes: [60, 62, 64, 66, 68, 70, 72, 74],
    description: "Whole tone scale - swirling and unstable"
  }
};

export interface BaseInstrument {
  initialize: () => Promise<void>;
  start: (weather: WeatherData) => void;
  stop: () => void;
  cleanup: () => void;
  updatePattern?: (notes: string[]) => void;
}

export class PatternManager {
  private pattern: Tone.Pattern<string> | null = null;

  constructor(
    private callback: (time: number, note: string) => void,
    private interval: string = "8n"
  ) {}

  create(notes: string[]): void {
    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
    }

    this.pattern = new Tone.Pattern(this.callback, notes, "up");
    this.pattern.interval = this.interval;
    this.pattern.probability = 1;
  }

  update(notes: string[]): void {
    if (this.pattern) {
      this.pattern.values = notes;
    } else {
      this.create(notes);
    }
  }

  start(): void {
    this.pattern?.start(0);
  }

  stop(): void {
    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
      this.pattern = null;
    }
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
