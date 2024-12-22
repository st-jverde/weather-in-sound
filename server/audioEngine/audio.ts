import * as Tone from "tone";

let synth: Tone.PolySynth<Tone.Synth> | null = null;
let reverb: Tone.Reverb | null = null;
let transportInitialized = false;

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

export const playWeatherMelody = (weather: {
  temperature: number;
  humidity: number;
  windSpeed: number;
}) => {
  if (!synth || !reverb) {
    console.error("Audio engine not initialized");
    return;
  }

  // Map temperature to pitch
  const baseNote = 48; // C3 (MIDI note number for a cold base)
  const maxNote = 84; // C6 (hot upper limit)
  const pitch = Math.min(
    maxNote,
    Math.max(baseNote, baseNote + Math.round(weather.temperature / 2))
  );

  // Map humidity to reverb (0.5 to 6 seconds)
  const reverbTime = Math.min(6, Math.max(0.5, weather.humidity / 10));
  reverb.decay = reverbTime;

  // Map wind speed to BPM (60 to 200 BPM)
  const bpm = Math.min(200, Math.max(60, Math.round(weather.windSpeed * 2)));
  Tone.Transport.bpm.value = bpm;

  // Generate a simple melody
  const melody = [pitch, pitch + 4, pitch + 7, pitch + 12]; // Major triad with octave
  const duration = "4n"; // Quarter-note duration

  // Schedule the melody
  const part = new Tone.Part(
    (time, note) => {
      synth?.triggerAttackRelease(Tone.Frequency(note, "midi").toFrequency(), duration, time);
    },
    melody.map((note, index) => [index * Tone.Time(duration).toSeconds(), note]) // Schedule at intervals
  );

  // Loop the part for continuous playback
  part.loop = true;
  part.loopEnd = `${melody.length * 4}n`; // Full cycle
  part.start(0);

  return part; // Return the part to stop it later if needed
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
