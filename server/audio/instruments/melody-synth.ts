import * as Tone from "tone";
import { WeatherData, BaseInstrument, AudioParameterMapper } from "../../types/audio-types";
import { getMelodyPattern, MelodyPattern } from "../melody-patterns";

export class MelodySynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private pattern: Tone.Part | null = null;
  private isPlaying: boolean = false;
  private currentPattern: MelodyPattern | null = null;

  async initialize(): Promise<void> {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 },
      volume: -5 // Increased volume from -10 to -5
    }).toDestination();
    console.log("MelodySynth initialized");
  }

  start(weather: WeatherData): void {
    if (!this.synth) {
      console.error("MelodySynth not initialized");
      return;
    }

    console.log("MelodySynth starting with weather:", weather);
    const params = AudioParameterMapper.mapWeatherToParameters(weather);
    Tone.Transport.bpm.value = params.bpm;
    this.currentPattern = getMelodyPattern(weather.condition.toLowerCase());
    this.isPlaying = true;
    this.schedulePattern();
  }

  private schedulePattern() {
    if (!this.currentPattern || !this.synth) {
      console.error("No pattern or synth available for melody");
      return;
    }

    // Stop any existing pattern
    if (this.pattern) {
      this.pattern.dispose();
      this.pattern = null;
    }

    console.log("Scheduling melody pattern:", this.currentPattern.pattern);

    // Create a simple repeating pattern that plays every 2 measures
    this.pattern = new Tone.Part((time, note) => {
      if (!this.isPlaying || !this.synth) return;
      console.log(`Melody playing note: ${note.note} at ${time}`);
      this.synth.triggerAttackRelease(note.note, note.duration, time);
    }, this.currentPattern.pattern);

    // Start the pattern immediately and repeat every 2 measures
    this.pattern.start(0);
    this.pattern.loop = true;
    this.pattern.loopEnd = "2m";

    console.log("Melody pattern scheduled and started");
  }

  stop(): void {
    console.log("MelodySynth stopping");
    this.isPlaying = false;
    if (this.pattern) {
      this.pattern.dispose();
      this.pattern = null;
    }
  }

  cleanup(): void {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}
