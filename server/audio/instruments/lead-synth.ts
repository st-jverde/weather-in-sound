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
  private volume: Tone.Volume | null = null;
  private patternManager: PatternManager | null = null;

  private addOctave(note: string, octave: number): string {
    const baseNote = note.replace(/\d+$/, '');
    return `${baseNote}${octave}`;
  }

  private getRandomNotes(scale: string[], baseOctave: number, numNotes: number = 8): string[] {
    const scaleCopy = [...scale];
    const randomNotes: string[] = [];

    for (let i = 0; i < numNotes; i++) {
      // Ensure we don't run out of notes by reshuffling
      if (scaleCopy.length === 0) {
        scaleCopy.push(...scale);
      }

      // Remove a random note from the scale
      const randomIndex = Math.floor(Math.random() * scaleCopy.length);
      const selectedNote = scaleCopy.splice(randomIndex, 1)[0];

      // Add the note with octave
      randomNotes.push(this.addOctave(selectedNote, baseOctave));
    }

    return randomNotes;
  }

  async initialize(): Promise<void> {
    this.volume = new Tone.Volume(-12).toDestination();

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

    this.setVolume(-20 + (weather.windSpeed / 10));

    // Generate and update pattern with randomized notes each time
    const currentNotes = this.getRandomNotes(scale.notes, params.baseOctave);
    this.patternManager.update(currentNotes);
    this.patternManager.start();
  }

  setVolume(volumeLevel: number): void {
    if (this.volume) {
      this.volume.volume.value = volumeLevel;
    }
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
