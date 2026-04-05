import * as Tone from "tone";
import { WeatherData, Locations, CompositionParams } from "../types/audio-types";
import { LeadSynth } from "./instruments/lead-synth";
import { BassSynth } from "./instruments/bass-synth";
import { MelodySynth } from "./instruments/melody-synth";
import { buildCompositionParams } from "./weather-music-params";

const DEFAULT_MASTER_GAIN = 0.92;

export class AudioEngine {
  private leadSynth: LeadSynth;
  private bassSynth: BassSynth;
  private melodySynth: MelodySynth;
  private transportInitialized = false;
  private currentWeather: WeatherData | null = null;
  private currentLocation: Locations | null = null;
  private compositionParams: CompositionParams | null = null;
  private masterMix: Tone.Gain | null = null;

  private melodyEnabled = true;
  private leadEnabled = true;
  private bassEnabled = true;

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

      if (!this.masterMix) {
        this.masterMix = new Tone.Gain(DEFAULT_MASTER_GAIN).toDestination();
      }

      await Promise.all([
        this.leadSynth.initialize(this.masterMix),
        this.bassSynth.initialize(this.masterMix),
        this.melodySynth.initialize(this.masterMix)
      ]);
    } catch (error) {
      console.error("Error initializing audio engine:", error);
      throw error;
    }
  }

  playWeatherMelody(weather: WeatherData, location: Locations): void {
    this.currentWeather = weather;
    this.currentLocation = location;
    this.compositionParams = buildCompositionParams(weather);

    this.resetMasterGain();

    Tone.Transport.bpm.value = this.compositionParams.bpm;

    if (this.leadEnabled) {
      this.leadSynth.start(weather, this.compositionParams, location);
    }
    if (this.bassEnabled) {
      this.bassSynth.start(weather, this.compositionParams);
    }
    if (this.melodyEnabled) {
      this.melodySynth.start(weather, this.compositionParams, location);
    }
  }

  stopMelody(): void {
    this.leadSynth.stop();
    this.bassSynth.stop();
    this.melodySynth.stop();
  }

  /** Restore master bus level after a fade (e.g. before resuming playback). */
  resetMasterGain(): void {
    if (!this.masterMix) return;
    const now = Tone.now();
    this.masterMix.gain.cancelScheduledValues(now);
    this.masterMix.gain.value = DEFAULT_MASTER_GAIN;
  }

  /**
   * Smooth fade to silence, then stop all instrument patterns.
   * `postSilenceMs` waits past the ramp so the gain reaches true zero (avoids teardown clicks).
   */
  fadeOutAndStop(durationSec: number, postSilenceMs = 90): Promise<void> {
    return new Promise((resolve) => {
      if (!this.masterMix) {
        this.stopMelody();
        resolve();
        return;
      }
      const now = Tone.now();
      this.masterMix.gain.cancelScheduledValues(now);
      this.masterMix.gain.rampTo(0, durationSec, now);
      const waitMs = durationSec * 1000 + postSilenceMs;
      window.setTimeout(() => {
        if (this.masterMix) {
          const t = Tone.now();
          this.masterMix.gain.cancelScheduledValues(t);
          this.masterMix.gain.value = 0;
        }
        this.stopMelody();
        resolve();
      }, waitMs);
    });
  }

  toggleMelody(enabled: boolean): void {
    this.melodyEnabled = enabled;
    if (enabled && this.currentWeather && this.compositionParams) {
      this.melodySynth.start(
        this.currentWeather,
        this.compositionParams,
        this.currentLocation ?? undefined
      );
    } else {
      this.melodySynth.stop();
    }
  }

  toggleLead(enabled: boolean): void {
    this.leadEnabled = enabled;
    if (enabled && this.currentWeather && this.compositionParams && this.currentLocation) {
      this.leadSynth.start(this.currentWeather, this.compositionParams, this.currentLocation);
    } else {
      this.leadSynth.stop();
    }
  }

  toggleBass(enabled: boolean): void {
    this.bassEnabled = enabled;
    if (enabled && this.currentWeather && this.compositionParams) {
      this.bassSynth.start(this.currentWeather, this.compositionParams);
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
    if (this.masterMix) {
      this.masterMix.dispose();
      this.masterMix = null;
    }
    this.transportInitialized = false;
    this.compositionParams = null;
  }
}
