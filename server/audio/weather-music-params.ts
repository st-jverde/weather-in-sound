import {
  AudioParameterMapper,
  CompositionParams,
  WeatherData
} from "../types/audio-types";
import { clamp, lerp } from "./music-utils";

export function buildCompositionParams(weather: WeatherData): CompositionParams {
  const base = AudioParameterMapper.mapWeatherToParameters(weather);
  const rainNorm = clamp(weather.rain / 20, 0, 1);
  const cloudNorm = weather.cloudCover / 100;
  const atmosphereWet = clamp(lerp(cloudNorm, 1, rainNorm * 0.5 + 0.5), 0, 1);
  const dayBrightness = weather.isDay ? 1 : 0.35;

  const reverbWet = clamp(
    base.reverbWet * (0.85 + atmosphereWet * 0.25) * (0.75 + dayBrightness * 0.25),
    0.15,
    0.85
  );
  const reverbDecay = clamp(base.reverbDecay * (1 + atmosphereWet * 0.35), 0.8, 10);

  return {
    ...base,
    reverbWet,
    reverbDecay,
    atmosphereWet,
    dayBrightness
  };
}
