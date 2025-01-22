import * as Tone from "tone";
import {
  WeatherData,
  BaseInstrument,
  PatternManager,
  AudioParameterMapper
} from "../../types/audio-types";

export class BassSynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private reverb: Tone.Reverb | null = null;
  private patternManager: PatternManager | null = null;

  private addOctave(note: string, octave: number): string {
    const baseNote = note.replace(/\d+$/, '');
    return `${baseNote}${octave}`;
  }

  private getTriadNotes(scale: string[], baseOctave: number): string[] {
    return [
      this.addOctave(scale[0], baseOctave - 1), // Root note, one octave lower
      this.addOctave(scale[2], baseOctave - 1), // Third
      this.addOctave(scale[4], baseOctave - 1)  // Fifth
    ];
  }

  async initialize(): Promise<void> {
    // Using PolySynth to allow overlapping notes for the drone effect
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sawtooth"
      },
      envelope: {
        attack: 0.4,    // Slower attack for smoother transitions
        decay: 0.5,     // Longer decay
        sustain: 0.9,   // High sustain for continuous sound
        release: 2.0    // Long release for overlapping
      },
      volume: -12
    });

    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.3,
      preDelay: 0.1
    }).toDestination();

    await this.reverb.generate();
    this.synth.connect(this.reverb);

    // Create pattern manager with longer note duration for drone effect
    this.patternManager = new PatternManager((time, note) => {
      if (this.synth) {
        // Using longer note duration and starting next note before current ends
        this.synth.triggerAttackRelease(note, "2n", time, 0.7);
      }
    }, "2n"); // Half note interval for slower changes
  }

  start(weather: WeatherData): void {
    if (!this.synth || !this.reverb || !this.patternManager) return;

    const params = AudioParameterMapper.mapWeatherToParameters(weather);
    const scale = AudioParameterMapper.getScaleForWeather(weather);

    // Apply parameters
    this.reverb.wet.value = params.reverbWet * 0.8; // Slightly reduced reverb for clarity
    this.reverb.decay = params.reverbDecay * 1.5;   // Extended decay for drone
    Tone.Transport.bpm.value = params.bpm * 0.5;    // Slower tempo for bass

    // Generate and update pattern with triad notes
    const triadNotes = this.getTriadNotes(scale.notes, params.baseOctave - 1);
    this.patternManager.update(triadNotes);
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
