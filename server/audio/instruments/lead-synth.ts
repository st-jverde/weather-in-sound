import * as Tone from "tone";
import {
  WeatherData,
  BaseInstrument,
  PatternManager,
  NoteData,
  CompositionParams,
  AudioParameterMapper,
  Locations
} from "../../types/audio-types";
import { addOctave, clamp, transposeNote } from "../music-utils";

type DurationStr = "16n" | "8n" | "4n" | "2n";

export class LeadSynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private reverb: Tone.Reverb | null = null;
  private leadVolume: Tone.Volume | null = null;
  private patternManager: PatternManager | null = null;

  private pickDuration(windSpeed: number, humidity: number): DurationStr {
    const w = clamp(windSpeed / 35, 0, 1);
    const h = humidity / 100;
    const r = Math.random();
    if (h > 0.72 && r < 0.38) {
      return r < 0.55 ? "2n" : "4n";
    }
    if (w > 0.55 && r < 0.42) {
      return "16n";
    }
    if (r < 0.22) {
      return "4n";
    }
    if (r < 0.58) {
      return "8n";
    }
    return "16n";
  }

  private getRandomNotes(
    scale: string[],
    baseOctave: number,
    windSpeed: number,
    transposition: number,
    humidity: number,
    _airPressure: number,
    params: CompositionParams
  ): NoteData[] {
    const getNumberOfNotes = (ws: number) => {
      if (ws <= 1) return 3;
      if (ws <= 5) return 6;
      if (ws <= 10) return 8;
      if (ws <= 15) return 9;
      if (ws <= 20) return 10;
      if (ws <= 25) return 12;
      if (ws <= 30) return 15;
      return 3;
    };
    const numberOfNotes = getNumberOfNotes(windSpeed);

    const scaleCopy = [...scale];
    const randomNotes: NoteData[] = [];

    for (let i = 0; i < numberOfNotes; i++) {
      if (scaleCopy.length === 0) {
        scaleCopy.push(...scale);
      }

      const randomIndex = Math.floor(Math.random() * scaleCopy.length);
      const selectedNote = scaleCopy.splice(randomIndex, 1)[0];

      const transposedNote = transposeNote(addOctave(selectedNote, baseOctave), transposition);

      const phraseT = i / Math.max(1, numberOfNotes - 1);
      const phraseAccent = 0.65 + 0.35 * Math.cos(phraseT * Math.PI);
      const downbeatBoost = i % 4 === 0 ? 0.12 : 0;

      const baseVelocity = 0.32 + Math.random() * 0.55;
      const windFactor = Math.min(windSpeed / 30, 1);
      const dynamicRange = 0.2 + windFactor * 0.55;
      const dynamicOffset = (Math.random() - 0.5) * dynamicRange;

      let velocity = clamp(
        (baseVelocity + dynamicOffset) * phraseAccent * (0.85 + params.dayBrightness * 0.15) + downbeatBoost,
        0.12,
        1
      );

      velocity *= 1 - params.atmosphereWet * 0.12;

      const duration = this.pickDuration(windSpeed, humidity);

      randomNotes.push({
        note: transposedNote,
        velocity,
        silent: false,
        duration
      });
    }

    return randomNotes;
  }

  private mapEnvelope = (lat: number, long: number) => {
    return {
      attack: 0.1 + (Math.abs(lat) / 180) * 0.6,
      decay: 0.1 + (Math.abs(long) / 180) * 0.3,
      sustain: 0.3 + (1 - Math.abs(long) / 180) * 0.4,
      release: 0.2 + (Math.abs(lat) / 180) * 0.8
    };
  };

  async initialize(destination?: Tone.ToneAudioNode): Promise<void> {
    const dest = destination ?? Tone.getDestination();

    this.leadVolume = new Tone.Volume(-12);
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.4,
        decay: 0.2,
        sustain: 0.6,
        release: 0.8
      },
      volume: -8
    });

    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.5,
      preDelay: 0.1
    });

    await this.reverb.generate();
    this.synth.connect(this.reverb);
    this.reverb.connect(this.leadVolume);
    this.leadVolume.connect(dest);

    this.patternManager = new PatternManager((time, note, velocity = 0.8, duration = "8n") => {
      if (!this.synth) return;
      const originalVolume = this.synth.volume.value;
      this.synth.volume.value = originalVolume + (velocity - 0.8) * 20;
      const startSec =
        Tone.Time(time).toSeconds() + (Math.random() - 0.5) * 0.016;
      this.synth.triggerAttackRelease(note, duration, startSec, velocity);
      this.synth.volume.value = originalVolume;
    });
  }

  start(weather: WeatherData, params: CompositionParams, location?: Locations): void {
    if (!this.synth || !this.reverb || !this.patternManager || !location) return;

    const scale = AudioParameterMapper.getScaleForWeather(weather);

    const envelope = this.mapEnvelope(location.lat, location.long);

    this.synth.set({
      oscillator: { type: scale.synth },
      envelope: envelope
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    this.reverb.wet.value = params.reverbWet;
    this.reverb.decay = params.reverbDecay;
    Tone.Transport.bpm.value = params.bpm;

    this.leadVolume!.volume.value = -20 + weather.windSpeed / 10 + params.dayBrightness * 4;

    this.patternManager.setAirPressure(weather.airPressure);
    this.patternManager.setHumidity(weather.humidity);

    const currentNotes = this.getRandomNotes(
      scale.notes,
      params.baseOctave,
      weather.windSpeed,
      weather.transposition,
      weather.humidity,
      weather.airPressure,
      params
    );
    this.patternManager.update(currentNotes);
    this.patternManager.start();
  }

  setVolume(volumeLevel: number): void {
    if (this.leadVolume) {
      this.leadVolume.volume.value = volumeLevel;
    }
  }

  updatePattern(notes: string[] | NoteData[]): void {
    this.patternManager?.update(notes);
  }

  stop(): void {
    this.patternManager?.stop();
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
    if (this.leadVolume) {
      this.leadVolume.dispose();
      this.leadVolume = null;
    }
  }
}
