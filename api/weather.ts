import dotenv from 'dotenv';
import { fetchWeatherApi } from 'openmeteo';

// Load environment variables from .env file
dotenv.config();

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const VITE_GEOCODING_API_KEY = process.env.VITE_GEOCODING_API_KEY || 'default_api_key';

console.log(VITE_GEOCODING_API_KEY);

if (!VITE_GEOCODING_API_KEY) {
  throw new Error("VITE_GEOCODING_API_KEY is not defined in the environment variables.");
}

const GEOCODING_URL = "https://api.opencagedata.com/geocode/v1/json";

export async function getCoordinates(location: string): Promise<{ latitude: number; longitude: number }> {
  const response = await fetch(
    `${GEOCODING_URL}?q=${encodeURIComponent(location)}&key=${VITE_GEOCODING_API_KEY}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch coordinates");
  }
  const data = await response.json();
  if (data.results.length === 0) {
    throw new Error("Location not found");
  }

  const { lat, lng } = data.results[0].geometry;
  return { latitude: lat, longitude: lng };
}


export async function getWeather(latitude: number, longitude: number) {
  const params = {
    latitude,
    longitude,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "is_day",
      "rain",
      "showers",
      "snowfall",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_direction_10m"
    ],
  };

  const response = await fetchWeatherApi(BASE_URL, params);
  if (!response || response.length === 0) {
    throw new Error("Failed to fetch weather data");
  }

  const current = response[0].current();

  // Check for null and throw an error or return a default
  if (!current) {
    throw new Error("Current weather data is not available");
  }

  return {
    temperature: current.variables(0)!.value(),
    humidity: current.variables(1)!.value(),
    isDay: current.variables(2)!.value(),
    rain: current.variables(3)!.value(),
    condition: determineCondition(current.variables(6)!.value()), // Map weather_code to a string
    windSpeed: current.variables(8)!.value(),
    windDirection: current.variables(9)!.value(),
  };
}

function determineCondition(weatherCode: number): string {
  // Map weather codes to human-readable conditions
  switch (weatherCode) {
    case 0:
      return "Sunny";
    case 1:
    case 2:
      return "Cloudy";
    case 3:
      return "Overcast";
    case 61:
    case 63:
      return "Rainy";
    case 71:
      return "Snowy";
    case 80:
      return "Windy";
    default:
      return "Unknown";
  }
}


// import { fetchWeatherApi } from 'openmeteo';

// const params = {
// 	"latitude": 52.52,
// 	"longitude": 13.41,
// 	"current": ["temperature_2m", "relative_humidity_2m", "is_day", "rain", "showers", "snowfall", "weather_code", "cloud_cover", "wind_speed_10m", "wind_direction_10m"]
// };
// const url = "https://api.open-meteo.com/v1/forecast";
// const responses = await fetchWeatherApi(url, params);

// // Helper function to form time ranges
// const range = (start: number, stop: number, step: number) =>
// 	Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

// // Process first location. Add a for-loop for multiple locations or weather models
// const response = responses[0];

// // Attributes for timezone and location
// const utcOffsetSeconds = response.utcOffsetSeconds();
// const timezone = response.timezone();
// const timezoneAbbreviation = response.timezoneAbbreviation();
// const latitude = response.latitude();
// const longitude = response.longitude();

// const current = response.current()!;

// // Note: The order of weather variables in the URL query and the indices below need to match!
// export const weatherData = {
// 	current: {
// 		time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
// 		temperature2m: current.variables(0)!.value(),
// 		relativeHumidity2m: current.variables(1)!.value(),
// 		isDay: current.variables(2)!.value(),
// 		rain: current.variables(3)!.value(),
// 		showers: current.variables(4)!.value(),
// 		snowfall: current.variables(5)!.value(),
// 		weatherCode: current.variables(6)!.value(),
// 		cloudCover: current.variables(7)!.value(),
// 		windSpeed10m: current.variables(8)!.value(),
// 		windDirection10m: current.variables(9)!.value(),
// 	},

// };

// // `weatherData` now contains a simple structure with arrays for datetime and weather data
