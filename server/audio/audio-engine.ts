import * as Tone from "tone";
import { WeatherData, Locations } from "../types/audio-types";
import { LeadSynth } from "./instruments/lead-synth";
import { BassSynth } from "./instruments/bass-synth";

export class AudioEngine {
  private leadSynth: LeadSynth;
  private bassSynth: BassSynth;
  private transportInitialized = false;

  constructor() {
    this.leadSynth = new LeadSynth();
    this.bassSynth = new BassSynth();
  }

  async initialize(): Promise<void> {
    try {
      if (!this.transportInitialized) {
        await Tone.start();
        await Tone.getContext().resume();
        Tone.Transport.start();
        this.transportInitialized = true;
      }

      await Promise.all([
        this.leadSynth.initialize(),
        this.bassSynth.initialize()
      ]);
    } catch (error) {
      console.error("Error initializing audio engine:", error);
      throw error;
    }
  }

  playWeatherMelody(weather: WeatherData, location: Locations): void {
    this.leadSynth.start(weather, location);
    this.bassSynth.start(weather);
  }

  stopMelody(): void {
    this.leadSynth.stop();
    this.bassSynth.stop();
  }

  cleanup(): void {
    this.leadSynth.cleanup();
    this.bassSynth.cleanup();
    this.transportInitialized = false;
  }
}
