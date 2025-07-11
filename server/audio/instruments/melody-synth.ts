import * as Tone from "tone";
import { WeatherData, BaseInstrument, AudioParameterMapper } from "../../types/audio-types";
import { getMelodyPattern, MelodyPattern } from "../melody-patterns";

export class MelodySynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private pattern: Tone.Part | null = null;
  private loopCounter: number = 0;
  private currentPattern: MelodyPattern | null = null;
  private isPlaying: boolean = false;

  async initialize(): Promise<void> {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 },
      volume: -12
    }).toDestination();
  }

  start(weather: WeatherData): void {
    if (!this.synth) return;
    const params = AudioParameterMapper.mapWeatherToParameters(weather);
    Tone.Transport.bpm.value = params.bpm;
    this.currentPattern = getMelodyPattern(weather.condition.toLowerCase());
    this.loopCounter = 0;
    this.isPlaying = true;
    this.schedulePattern();
  }

  private schedulePattern() {
    if (!this.currentPattern) return;
    if (this.pattern) {
      this.pattern.dispose();
      this.pattern = null;
    }
    // Schedule a callback every 1 measure
    Tone.Transport.scheduleRepeat((time) => {
      if (!this.isPlaying || !this.synth) return;
      this.loopCounter = (this.loopCounter + 1) % 8;
      if (this.loopCounter === 0) {
        // Play the melody pattern
        this.pattern = new Tone.Part((t, note) => {
          this.synth!.triggerAttackRelease(note.note, note.duration, t);
        }, this.currentPattern!.pattern).start(time);
      }
    }, "1m");
  }

  stop(): void {
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
