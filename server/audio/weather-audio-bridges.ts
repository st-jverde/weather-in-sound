import * as Tone from 'tone';
import { AudioEngine } from './audio-engine';
import { Locations } from 'server/types/audio-types';

let audioEngine: AudioEngine | null = null;

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
    audioEngine?.playWeatherMelody(weatherData, location);
  } catch (error) {
    console.error('Error playing weather sound:', error);
    throw error;
  }
};

export const stopWeatherSound = () => {
  if (audioEngine) {
    audioEngine.stopMelody();
  }
};

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
  return { melody: false, lead: true, bass: true };
};
