import * as Tone from "tone";
import {
  WeatherData,
  BaseInstrument,
  PatternManager,
  AudioParameterMapper,
  Locations
} from "../../types/audio-types";

export class LeadSynth implements BaseInstrument {
  private synth: Tone.PolySynth<Tone.Synth> | null = null;
  private reverb: Tone.Reverb | null = null;
  private volume: Tone.Volume | null = null;
  // private lfo: Tone.LFO | null = null;
  private patternManager: PatternManager | null = null;

  private transposeNote(note: string, semitones: number): string {
    // Extract the note and octave
    const match = note.match(/^([A-Ga-g]#?b?)(\d+)$/);
    if (!match) return note; // Return the original note if format is unexpected

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, notePart, octavePart] = match;
    let octave = parseInt(octavePart, 10);

    // Define a chromatic scale
    const chromaticScale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteIndex = chromaticScale.indexOf(notePart);

    if (noteIndex === -1) return note; // If the note isn't found, return it unchanged

    // Calculate the new index after transposition
    let newIndex = noteIndex + semitones;

    // Adjust octave and wrap notes correctly
    while (newIndex < 0) {
      newIndex += chromaticScale.length;
      octave -= 1;
    }
    while (newIndex >= chromaticScale.length) {
      newIndex -= chromaticScale.length;
      octave += 1;
    }

    return chromaticScale[newIndex] + octave;
  }


  private addOctave(note: string, octave: number): string {
    const baseNote = note.replace(/\d+$/, '');
    return `${baseNote}${octave}`;
  }

  private getRandomNotes(
    scale: string[],
    baseOctave: number,
    windSpeed: number,
    transposition: number
  ): string[] {
    // const numberOfNotes = Math.min(10, Math.max(1, Math.ceil(windSpeed / 10)));
    const getNumberOfNotes = (windSpeed: number) => {
      if (windSpeed <= 1) return 3;
      if (windSpeed <= 5) return 6;
      if (windSpeed <= 10) return 8;
      if (windSpeed <= 15) return 9;
      if (windSpeed <= 20) return 10;
      if (windSpeed <= 25) return 12;
      if (windSpeed <= 30) return 15;
      return 1;
    };
    const numberOfNotes = getNumberOfNotes(windSpeed);
    console.log("numberOfNotes: ", numberOfNotes);
    const scaleCopy = [...scale];
    const randomNotes: string[] = [];

    for (let i = 0; i < numberOfNotes; i++) {
      // Ensure we don't run out of notes by reshuffling
      if (scaleCopy.length === 0) {
        scaleCopy.push(...scale);
      }

      // Remove a random note from the scale
      const randomIndex = Math.floor(Math.random() * scaleCopy.length);
      const selectedNote = scaleCopy.splice(randomIndex, 1)[0];

      const transposedNote = this.transposeNote(this.addOctave(selectedNote, baseOctave), transposition);
      randomNotes.push(transposedNote);
    }

    return randomNotes;
  }
  // function mapEnvelope(lat: number, long: number) {
  //   return {
  //     attack: 0.1 + (Math.abs(lat) / 180) * 0.6, // 0.1 → 0.7 (Poles = longer attack)
  //     decay: 0.1 + (Math.abs(long) / 180) * 0.3, // 0.1 → 0.4 (Spread across longitudes)
  //     sustain: 0.3 + (1 - Math.abs(long) / 180) * 0.4, // 0.3 → 0.7 (Inverse of decay)
  //     release: 0.2 + (Math.abs(lat) / 180) * 0.8, // 0.2 → 1.0 (Poles = longer release)
  //   };
  // }

  private mapEnvelope = (lat: number, long: number) => {
    return {
          attack: 0.1 + (Math.abs(lat) / 180) * 0.6, // 0.1 → 0.7 (Poles = longer attack)
          decay: 0.1 + (Math.abs(long) / 180) * 0.3, // 0.1 → 0.4 (Spread across longitudes)
          sustain: 0.3 + (1 - Math.abs(long) / 180) * 0.4, // 0.3 → 0.7 (Inverse of decay)
          release: 0.2 + (Math.abs(lat) / 180) * 0.8, // 0.2 → 1.0 (Poles = longer release)
        };
  }

  async initialize(): Promise<void> {
    this.volume = new Tone.Volume(-12).toDestination();

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
      volume: -6
    });

    this.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.5,
      preDelay: 0.1
    }).toDestination();

    await this.reverb.generate();
    this.synth.connect(this.reverb);
    // this.synth.connect(this.volume);

    this.patternManager = new PatternManager((time, note) => {
      this.synth?.triggerAttackRelease(note, "8n", time);
    });
  }

  start(weather: WeatherData, location: Locations): void {
    if (!this.synth || !this.reverb || !this.patternManager) return;

    const params = AudioParameterMapper.mapWeatherToParameters(weather);
    const scale = AudioParameterMapper.getScaleForWeather(weather);

    // const transposition = weather.transposition;
    // const transposedNotes = selectedNotes.map(note => note + transposition);
    // console.log(`Wind Direction: ${weatherData.windDirection}, Transposing by: ${transposition} semitones`);

    // Map envelope using latitude and longitude
    const envelope = this.mapEnvelope(location.lat, location.long);

    this.synth.set({
      oscillator: { type: scale.synth },
      envelope: envelope, // Apply mapped envelope values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Apply parameters
    this.reverb.wet.value = params.reverbWet;
    this.reverb.decay = params.reverbDecay;
    Tone.Transport.bpm.value = params.bpm;
    console.log("synth type: ", scale.synth);
    console.log("reverb wet: ", params.reverbWet);
    console.log("reverb decay: ", params.reverbDecay);
    console.log("bpm: ", params.bpm);

    this.setVolume(-20 + (weather.windSpeed / 10));

    // Generate and update pattern with randomized notes each time
    const currentNotes = this.getRandomNotes(scale.notes, params.baseOctave, weather.windSpeed, weather.transposition);
    this.patternManager.update(currentNotes);
    this.patternManager.start();
  }

  // Dispose previous LFO if it exists
  // if (lfo) {
  //   this.lfo.dispose();
  // }

  // // Create and configure LFO for volume modulation
  // const lfoRate = 0.1 + (weather.temperature / 100) * 5; // 0.1 to 5 Hz
  // const lfoDepth = (weather.humidity / 100) * 12; // Up to 12 dB variation

  // this.lfo = new Tone.LFO({
  //   frequency: lfoRate,
  //   min: -lfoDepth,
  //   max: lfoDepth
  // }).start();

  // this.lfo.connect(this.volume.volume);

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
    // if (this.lfo) {
    //   this.lfo.dispose();
    //   this.lfo = null;
    // }
  }
}
