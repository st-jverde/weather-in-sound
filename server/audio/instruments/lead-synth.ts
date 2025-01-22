import * as Tone from "tone";
import {
  WeatherData,
  BaseInstrument,
  PatternManager,
  AudioParameterMapper
} from "../../types/audio-types";

export class LeadSynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private reverb: Tone.Reverb | null = null;
  private patternManager: PatternManager | null = null;

  private addOctave(note: string, octave: number): string {
    const baseNote = note.replace(/\d+$/, '');
    return `${baseNote}${octave}`;
  }

  private getRandomNotes(scale: string[], baseOctave: number): string[] {
    return scale.map(note => this.addOctave(note, baseOctave));
  }

  async initialize(): Promise<void> {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.6,
        release: 0.8
      },
      volume: -6
    });

    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.5,
      preDelay: 0.1
    }).toDestination();

    await this.reverb.generate();
    this.synth.connect(this.reverb);

    this.patternManager = new PatternManager((time, note) => {
      this.synth?.triggerAttackRelease(note, "8n", time);
    });
  }

  start(weather: WeatherData): void {
    if (!this.synth || !this.reverb || !this.patternManager) return;

    const params = AudioParameterMapper.mapWeatherToParameters(weather);
    const scale = AudioParameterMapper.getScaleForWeather(weather);

    // Apply parameters
    this.reverb.wet.value = params.reverbWet;
    this.reverb.decay = params.reverbDecay;
    Tone.Transport.bpm.value = params.bpm;

    // Generate and update pattern
    const currentNotes = this.getRandomNotes(scale.notes, params.baseOctave);
    this.patternManager.update(currentNotes);
    this.patternManager.start();
  }

  updatePattern(notes: string[]): void {
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
  }
}
