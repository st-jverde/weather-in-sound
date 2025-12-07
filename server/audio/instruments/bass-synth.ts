import * as Tone from "tone";
import {
  WeatherData,
  BaseInstrument,
  PatternManager,
  AudioParameterMapper,
  NoteData
} from "../../types/audio-types";

export class BassSynth implements BaseInstrument {
  private synth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private volume: Tone.Volume | null = null;
  private patternManager: PatternManager | null = null;

  private addOctave(note: string, octave: number): string {
    const baseNote = note.replace(/\d+$/, '');
    return `${baseNote}${octave}`;
  }

  private getTriadNotes(scale: string[]): string[] {
    const bassOctave = 2; // Fixed bass octave
    return [
      this.addOctave(scale[0], bassOctave),
      this.addOctave(scale[2], bassOctave),
      this.addOctave(scale[4], bassOctave)
    ];
  }

  async initialize(): Promise<void> {
    this.volume = new Tone.Volume(-6).toDestination();

    this.synth = new Tone.PolySynth({
      maxPolyphony: 2,
      voice: Tone.Synth,
      options: {
        oscillator: {
          type: "triangle2"
        },
        envelope: {
          attack: 0.4,
          decay: 0.5,
          sustain: 1,
          release: 0.9
        }
      }
    });

    this.chorus = new Tone.Chorus(4, 2.5, 0.5);

    this.reverb = new Tone.Reverb({
      decay: 2,
      wet: 0.2,
      preDelay: 0.1
    });

    await this.reverb.generate();

    this.synth
      .connect(this.chorus)
      .connect(this.reverb)
      .connect(this.volume);

    this.patternManager = new PatternManager((time, note) => {
      if (this.synth) {
        this.synth.triggerAttackRelease(note, "2n", time);
      }
    }, "2n");
  }

  start(weather: WeatherData): void {
    if (!this.synth || !this.reverb || !this.volume || !this.patternManager) return;

    const params = AudioParameterMapper.mapWeatherToParameters(weather);
    const scale = AudioParameterMapper.getScaleForWeather(weather);

    // this.reverb.wet.value = params.reverbWet * 0.8;
    // this.reverb.decay = params.reverbDecay * 1.5;
    Tone.Transport.bpm.value = params.bpm * 0.5;

    if (this.chorus) {
      this.chorus.frequency.value = Math.min(10, weather.windSpeed / 2);
      this.chorus.depth = Math.min(0.7, weather.windSpeed / 20);
    }

    const triadNotes = this.getTriadNotes(scale.notes);
    this.patternManager.update(triadNotes);
    this.patternManager.start();
  }

  setVolume(volumeLevel: number): void {
    if (this.volume) {
      this.volume.volume.value = volumeLevel;
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
    if (this.chorus) {
      this.chorus.dispose();
      this.chorus = null;
    }
    if (this.volume) {
      this.volume.dispose();
      this.volume = null;
    }
  }
}
