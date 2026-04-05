import * as Tone from 'tone';
import { AudioEngine } from './audio-engine';
import { Locations, WeatherData } from 'server/types/audio-types';

let audioEngine: AudioEngine | null = null;

/** Seconds — fade master bus when pausing (gentler). */
export const WEATHER_AUDIO_FADE_OUT_SEC = 1;

/** Shorter fade when leaving the city screen so audio hits silence quickly before teardown. */
export const WEATHER_AUDIO_BACK_FADE_OUT_SEC = 0.38;

/** Extra wait after ramp + hard zero so the graph is inaudible before `cleanup()` disconnects nodes. */
const CLEANUP_POST_SILENCE_MS = 140;
const SETTLE_BEFORE_DISPOSE_MS = 100;

export const initializeAudioEngine = async () => {
  try {
    // Ensure audio context starts from a user gesture
    await Tone.start();
    console.log('Audio context started');

    if (!audioEngine) {
      audioEngine = new AudioEngine();
      await audioEngine.initialize();
      console.log('Audio engine initialized');
    }
    return audioEngine;
  } catch (error) {
    console.error('Failed to initialize audio engine:', error);
    throw error;
  }
};

export const playWeatherSound = async (weatherData: {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  transposition: number;
  airPressure: number;
  rain: number;
  cloudCover: number;
  isDay: number;
  lat: number;
  long: number;
}) => {
  try {
    if (!audioEngine) {
      await initializeAudioEngine();
    }

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }

    const location: Locations = {
      city: "Your City Name", // Add the city here
      lat: weatherData.lat,
      long: weatherData.long
    };

    const weather: WeatherData = {
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      windSpeed: weatherData.windSpeed,
      condition: weatherData.condition,
      transposition: weatherData.transposition,
      airPressure: weatherData.airPressure,
      rain: weatherData.rain,
      cloudCover: weatherData.cloudCover,
      isDay: weatherData.isDay
    };

    audioEngine?.playWeatherMelody(weather, location);
  } catch (error) {
    console.error('Error playing weather sound:', error);
    throw error;
  }
};

/** Fade out then stop instruments (engine stays alive — use for pause). */
export async function fadeOutStopMusic(
  durationSec: number = WEATHER_AUDIO_FADE_OUT_SEC
): Promise<void> {
  if (audioEngine) {
    await audioEngine.fadeOutAndStop(durationSec);
  }
}

/** @deprecated Prefer {@link fadeOutStopMusic} */
export const stopWeatherSound = () => {
  if (audioEngine) {
    audioEngine.stopMelody();
  }
};

/** Fade out, dispose engine, clear singleton (use for back / full teardown). */
export async function cleanupAudioEngineWithFade(
  durationSec: number = WEATHER_AUDIO_BACK_FADE_OUT_SEC
): Promise<void> {
  if (audioEngine) {
    await audioEngine.fadeOutAndStop(durationSec, CLEANUP_POST_SILENCE_MS);
    await new Promise<void>((r) => setTimeout(r, SETTLE_BEFORE_DISPOSE_MS));
    audioEngine.cleanup();
    audioEngine = null;
    Tone.Transport.stop();
  }
}

/** Immediate teardown without fade — prefer {@link cleanupAudioEngineWithFade} for UI. */
export const cleanupAudioEngine = () => {
  if (audioEngine) {
    audioEngine.cleanup();
    audioEngine = null;
    Tone.Transport.stop();
  }
};

// Individual instrument controls
export const toggleMelody = (enabled: boolean) => {
  if (audioEngine) {
    audioEngine.toggleMelody(enabled);
  }
};

export const toggleLead = (enabled: boolean) => {
  if (audioEngine) {
    audioEngine.toggleLead(enabled);
  }
};

export const toggleBass = (enabled: boolean) => {
  if (audioEngine) {
    audioEngine.toggleBass(enabled);
  }
};

export const getInstrumentStates = () => {
  if (audioEngine) {
    return audioEngine.getInstrumentStates();
  }
  return { melody: true, lead: true, bass: true };
};

export const muteAudio = () => {
  Tone.getDestination().volume.rampTo(-Infinity, 0.1);
};

export const unmuteAudio = () => {
  Tone.getDestination().volume.rampTo(0, 0.1);
};

export const isMuted = (): boolean => {
  return Tone.getDestination().volume.value === -Infinity;
};
