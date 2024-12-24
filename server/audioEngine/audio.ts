import * as Tone from "tone";

let synth: Tone.PolySynth<Tone.Synth> | null = null;
let reverb: Tone.Reverb | null = null;
let transportInitialized = false;
let currentPart: Tone.Part<number> | null = null; // Keep track of the current melody part

export const startAudioEngine = async () => {
  if (!transportInitialized) {
    await Tone.start();
    Tone.Transport.start();
    transportInitialized = true;
  }
  if (!synth) {
    // Initialize the synth and reverb
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    reverb = new Tone.Reverb(4).toDestination(); // Default reverb time
    synth.connect(reverb);
  }
};

const weatherScales: Record<string, number[]> = {
  sunny: [0, 4, 7, 12, 16, 19, 21, 24], // Major triad with octave
  cloudy: [0, 2, 3, 5, 7, 9, 10, 12], // Dorian scale
  overcast: [0, 2, 3, 5, 7, 8, 10, 12], // Natural minor scale
  snowy: [0, 2, 4, 6, 7, 9, 11, 12], // Lydian scale
  rainy: [0, 2, 3, 5, 7, 8, 11, 12], // Harmonic minor scale
  windy: [0, 2, 4, 6, 8, 10, 12, 14], // Whole-tone scale
};

const getRandomNotes = (scale: number[], noteCount: number): number[] => {
  const shuffled = [...scale].sort(() => Math.random() - 0.5); // Shuffle the scale
  const repeated = [...shuffled, ...shuffled]; // Extend to avoid running out
  return repeated.slice(0, noteCount); // Pick the desired number of notes
};

export const playWeatherMelody = (weather: {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}) => {
  if (!synth || !reverb) {
    console.error("Audio engine not initialized");
    return;
  }

  if (currentPart) {
    currentPart.stop();
    currentPart.dispose();
  }

  const baseNote = 48; // C3
  const maxNote = 84; // C6
  const pitch = Math.min(
    maxNote,
    Math.max(baseNote, baseNote + Math.round(weather.temperature / 2))
  );

  const reverbTime = Math.min(6, Math.max(0.5, weather.humidity / 10));
  reverb.decay = reverbTime;

  const bpm = Math.min(200, Math.max(60, Math.round(weather.windSpeed * 2)));
  Tone.Transport.bpm.value = bpm;

  const scale =
    weatherScales[weather.condition.toLowerCase()] || weatherScales["sunny"];
  const melody = getRandomNotes(scale, 8).map((interval) => pitch + interval);

  console.log("melody: ", melody);

  const duration = "8n"; // Eighth-note duration

  const regenerateMelody = () => {
    const melody = getRandomNotes(scale, 8).map((interval) => pitch + interval);

    if (currentPart) {
      currentPart.clear(); // Clear existing notes in the part
      melody.forEach((note, index) => {
        currentPart?.add(index * Tone.Time(duration).toSeconds(), note);
      });
    }
  };

  currentPart = new Tone.Part<number>(
    (time, note) => {
      if (note !== null) { // Ensure note is not null
        synth?.triggerAttackRelease(
          Tone.Frequency(note, "midi").toFrequency(),
          duration,
          time
        );
      }
    },
    [] // Empty array, will add notes dynamically
  );

  currentPart.loop = true;
  currentPart.loopEnd = `${melody.length * Tone.Time(duration).toSeconds()}s`;
  currentPart.start(0);

  regenerateMelody();

  // Regenerate melody on loop
  currentPart.callback = () => {
    regenerateMelody();
  };
};

export const stopCurrentMelody = () => {
  if (currentPart) {
    currentPart.stop();
    currentPart.dispose();
    currentPart = null;
  }
};



// import * as Tone from 'tone';

// let isInitialized = false;

// export async function startAudioEngine() {
//   if (isInitialized) return; // Avoid reinitializing

//   // Start Tone.js audio context
//   await Tone.start();
//   console.log("Audio Engine Initialized");

//   // Create and connect effects
//   const reverb = new Tone.Reverb({ decay: 3, wet: 0.5 }).toDestination();
//   const limiter = new Tone.Limiter(-6).toDestination();
//   const masterVolume = new Tone.Volume(-12).connect(limiter);

//   // Connect the master effects chain
//   reverb.connect(masterVolume);

//   // Create a placeholder synth for testing
//   const synth = new Tone.Synth().connect(reverb);

//   // Play a test note when initialized
//   synth.triggerAttackRelease("C4", "1n");

//   isInitialized = true; // Set initialization state
// }
