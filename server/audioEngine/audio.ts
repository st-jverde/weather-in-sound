import * as Tone from "tone";

let synth: Tone.PolySynth<Tone.Synth> | null = null;
let reverb: Tone.Reverb | null = null;
let transportInitialized = false;
let currentPattern: Tone.Pattern<string> | null = null;

export const startAudioEngine = async () => {
  try {
    console.log("Starting audio engine...");
    if (!transportInitialized) {
      console.log("Initializing Tone.js...");
      await Tone.start();
      await Tone.getContext().resume();
      Tone.Transport.start();
      transportInitialized = true;
      console.log("Tone.js initialized successfully");
    }

    if (!synth) {
      console.log("Creating synth and effects...");
      synth = new Tone.PolySynth(Tone.Synth, {
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

      reverb = new Tone.Reverb({
        decay: 4,
        wet: 0.5,
        preDelay: 0.1
      });

      synth.connect(reverb);
      reverb.toDestination();
      console.log("Synth and effects created and connected");
    }
  } catch (error) {
    console.error("Error in startAudioEngine:", error);
    throw error;
  }
};

const weatherScales: Record<string, string[]> = {
  sunny: ["C", "E", "G", "A", "C", "E", "G", "A"],
  cloudy: ["C", "Eb", "F", "G", "Bb", "C", "Eb", "F"],
  overcast: ["C", "D", "Eb", "G", "Ab", "C", "D", "Eb"],
  rainy: ["C", "Eb", "F", "G", "Ab", "C", "Eb", "F"],
  snowy: ["C", "D", "F", "G", "A", "C", "D", "F"],
  windy: ["C", "D", "E", "F#", "G#", "A#", "C", "D"]
};

const addOctave = (note: string, octave: number): string => {
  const baseNote = note.replace(/\d+$/, '');
  return `${baseNote}${octave}`;
};

const getRandomNotes = (scale: string[], baseOctave: number): string[] => {
  const result: string[] = [];
  const available = scale.map(note => addOctave(note, baseOctave));

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    result.push(available[randomIndex]);
  }

  console.log(`Generated random notes with base octave ${baseOctave}:`, result);
  return result;
};

export const playWeatherMelody = (weather: {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}) => {
  console.log("PlayWeatherMelody called with weather:", weather);

  if (!synth || !reverb) {
    console.error("Audio engine not initialized");
    return;
  }

  // Stop current pattern if exists
  if (currentPattern) {
    currentPattern.stop();
    currentPattern.dispose();
  }

  // Calculate parameters
  const reverbWet = Math.min(0.8, Math.max(0.2, weather.humidity / 100));
  const reverbDecay = Math.min(8, Math.max(1, weather.humidity / 10));
  const bpm = Math.min(180, Math.max(60, 60 + weather.windSpeed * 2));
  const baseOctave = Math.round(2 + ((weather.temperature + 20) / 60) * 4);

  console.log(`Audio parameters:
    - Reverb wet: ${reverbWet}
    - Reverb decay: ${reverbDecay}
    - BPM: ${bpm}
    - Base octave: ${baseOctave}`
  );

  // Apply parameters
  reverb.wet.value = reverbWet;
  reverb.decay = reverbDecay;
  Tone.Transport.bpm.value = bpm;

  // Get scale and generate initial sequence
  const condition = weather.condition.toLowerCase();
  const scale = weatherScales[condition] || weatherScales.sunny;
  const currentNotes = getRandomNotes(scale, baseOctave);

  let noteIndex = 0;
  const totalNotes = currentNotes.length;

  // Create pattern
  currentPattern = new Tone.Pattern(
    (time, note) => {
      console.log(`Playing note: ${note} at time: ${time}`);
      synth?.triggerAttackRelease(note, "8n", time);

      // Update note index
      noteIndex = (noteIndex + 1) % totalNotes;

      // Generate new sequence when we complete the current one
      if (noteIndex === 0 && currentPattern) {
        const newNotes = getRandomNotes(scale, baseOctave);
        // Create a new pattern with the new notes
        const newPattern = new Tone.Pattern(
          currentPattern.callback,
          newNotes,
          "up"
        );
        newPattern.interval = "8n";
        newPattern.probability = 1;

        // Stop and dispose old pattern, start new one
        currentPattern.stop();
        newPattern.start("@1n");
        currentPattern.dispose();
        currentPattern = newPattern;
      }
    },
    currentNotes,
    "up"
  );

  // Set pattern properties
  currentPattern.interval = "8n";
  currentPattern.probability = 1;

  // Start the pattern
  console.log("Starting pattern with notes:", currentNotes);
  currentPattern.start(0);
};

export const stopCurrentMelody = () => {
  console.log("stopCurrentMelody called");
  if (currentPattern) {
    currentPattern.stop();
    currentPattern.dispose();
    currentPattern = null;
    console.log("Melody stopped and disposed");
  }
};

// // Weather scales for melody generation
// const weatherScales: Record<string, number[]> = {
//   sunny: [0, 4, 7, 12, 16, 19, 21, 24], // Major triad with octave
//   cloudy: [0, 2, 3, 5, 7, 9, 10, 12], // Dorian scale
//   overcast: [0, 2, 3, 5, 7, 8, 10, 12], // Natural minor scale
//   snowy: [0, 2, 4, 6, 7, 9, 11, 12], // Lydian scale
//   rainy: [0, 2, 3, 5, 7, 8, 11, 12], // Harmonic minor scale
//   windy: [0, 2, 4, 6, 8, 10, 12, 14], // Whole-tone scale
// };
