import * as Tone from "tone";
import { WeatherData, Locations } from "../types/audio-types";
import { LeadSynth } from "./instruments/lead-synth";
import { BassSynth } from "./instruments/bass-synth";
import { MelodySynth } from "./instruments/melody-synth";

export class AudioEngine {
  private leadSynth: LeadSynth;
  private bassSynth: BassSynth;
  private melodySynth: MelodySynth;
  private transportInitialized = false;
  private currentWeather: WeatherData | null = null;
  private currentLocation: Locations | null = null;

  // Individual instrument controls
  private melodyEnabled: boolean = true;
  private leadEnabled: boolean = true;
  private bassEnabled: boolean = true;

  constructor() {
    this.leadSynth = new LeadSynth();
    this.bassSynth = new BassSynth();
    this.melodySynth = new MelodySynth();
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
        this.bassSynth.initialize(),
        this.melodySynth.initialize()
      ]);
    } catch (error) {
      console.error("Error initializing audio engine:", error);
      throw error;
    }
  }

  playWeatherMelody(weather: WeatherData, location: Locations): void {
    this.currentWeather = weather;
    this.currentLocation = location;

    if (this.leadEnabled) {
      this.leadSynth.start(weather, location);
    }
    if (this.bassEnabled) {
      this.bassSynth.start(weather);
    }
    if (this.melodyEnabled) {
      this.melodySynth.start(weather);
    }
  }

  stopMelody(): void {
    this.leadSynth.stop();
    this.bassSynth.stop();
    this.melodySynth.stop();
  }

  // Individual instrument controls
  toggleMelody(enabled: boolean): void {
    this.melodyEnabled = enabled;
    if (enabled && this.currentWeather) {
      this.melodySynth.start(this.currentWeather);
    } else {
      this.melodySynth.stop();
    }
  }

  toggleLead(enabled: boolean): void {
    this.leadEnabled = enabled;
    if (enabled && this.currentWeather && this.currentLocation) {
      this.leadSynth.start(this.currentWeather, this.currentLocation);
    } else {
      this.leadSynth.stop();
    }
  }

  toggleBass(enabled: boolean): void {
    this.bassEnabled = enabled;
    if (enabled && this.currentWeather) {
      this.bassSynth.start(this.currentWeather);
    } else {
      this.bassSynth.stop();
    }
  }

  getInstrumentStates() {
    return {
      melody: this.melodyEnabled,
      lead: this.leadEnabled,
      bass: this.bassEnabled
    };
  }

  cleanup(): void {
    this.leadSynth.cleanup();
    this.bassSynth.cleanup();
    this.melodySynth.cleanup();
    this.transportInitialized = false;
  }
}
