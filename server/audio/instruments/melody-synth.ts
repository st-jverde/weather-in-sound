import * as Tone from "tone";
import {
  WeatherData,
  BaseInstrument,
  AudioParameterMapper,
  CompositionParams,
  Locations
} from "../../types/audio-types";
import { buildMelodyPhrase, MelodyPartValue } from "../melody-phrase";
import { clamp } from "../music-utils";

export class MelodySynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private reverb: Tone.Reverb | null = null;
  private melodyVolume: Tone.Volume | null = null;
  private filter: Tone.Filter | null = null;
  private pattern: Tone.Part | null = null;
  private isPlaying: boolean = false;

  async initialize(destination?: Tone.ToneAudioNode): Promise<void> {
    const dest = destination ?? Tone.getDestination();

    this.melodyVolume = new Tone.Volume(-18);
    this.filter = new Tone.Filter(3200, "lowpass");

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.08, decay: 0.15, sustain: 0.55, release: 0.45 },
      volume: -6
    });

    this.reverb = new Tone.Reverb({
      decay: 3,
      wet: 0.35,
      preDelay: 0.05
    });

    await this.reverb.generate();

    this.synth.connect(this.filter);
    this.filter.connect(this.reverb);
    this.reverb.connect(this.melodyVolume);
    this.melodyVolume.connect(dest);
  }

  start(weather: WeatherData, params: CompositionParams, location?: Locations): void {
    void location;
    if (!this.synth || !this.reverb || !this.melodyVolume || !this.filter) {
      console.error("MelodySynth not initialized");
      return;
    }

    Tone.Transport.bpm.value = params.bpm;

    this.reverb.wet.value = clamp(params.reverbWet * 0.95, 0.1, 0.75);
    this.reverb.decay = clamp(params.reverbDecay * 1.05, 0.5, 9);

    const wetDarken = params.atmosphereWet;
    this.filter.frequency.value = 1800 + (1 - wetDarken) * 2200 + params.dayBrightness * 400;
    this.melodyVolume.volume.value = -22 + params.dayBrightness * 8 - wetDarken * 3;

    const scale = AudioParameterMapper.getScaleForWeather(weather);
    const phrase = buildMelodyPhrase(weather, scale, params);
    const partEvents: [string | number, MelodyPartValue][] = phrase.map(([t, v]) => [t, v]);

    this.isPlaying = true;
    this.schedulePattern(partEvents);
  }

  private schedulePattern(partEvents: [string | number, MelodyPartValue][]) {
    if (!this.synth) return;

    if (this.pattern) {
      this.pattern.dispose();
      this.pattern = null;
    }

    this.pattern = new Tone.Part((time, value: MelodyPartValue) => {
      if (!this.isPlaying || !this.synth) return;
      const startSec =
        Tone.Time(time).toSeconds() + (Math.random() - 0.5) * 0.02;
      this.synth.triggerAttackRelease(
        value.note,
        value.duration,
        startSec,
        value.velocity
      );
    }, partEvents);

    this.pattern.loop = true;
    this.pattern.loopEnd = "2m";
    this.pattern.start(0);
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
    if (this.reverb) {
      this.reverb.dispose();
      this.reverb = null;
    }
    if (this.melodyVolume) {
      this.melodyVolume.dispose();
      this.melodyVolume = null;
    }
    if (this.filter) {
      this.filter.dispose();
      this.filter = null;
    }
  }
}
