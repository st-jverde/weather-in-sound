import * as Tone from 'tone';
import { AudioEngine } from './audio-engine';

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
}) => {
  try {
    if (!audioEngine) {
      await initializeAudioEngine();
    }

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }

    audioEngine?.playWeatherMelody(weatherData);
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
