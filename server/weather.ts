import { fetchWeatherApi } from 'openmeteo';

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

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
      "wind_direction_10m",
      "surface_pressure"
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

  const windInfo = getWindDirectionLabel(current.variables(9)!.value());

  return {
    temperature: Math.round(current.variables(0)!.value()),
    humidity: Math.round(current.variables(1)!.value()),
    isDay: current.variables(2)!.value(),
    rain: Math.round(current.variables(3)!.value()),
    condition: determineCondition(current.variables(6)!.value()), // Map weather_code to a string
    windSpeed: Math.round(current.variables(8)!.value()),
    windDirection: windInfo.label,  // Now a readable string (e.g., "North-East")
    transposition: windInfo.transposition,  // Transposition value
    airPressure: Math.round(current.variables(10)!.value()),
  };
}

// function getTransposition(windDirection: number): number {
//   if ((windDirection >= 337.5 && windDirection <= 360) || (windDirection >= 0 && windDirection < 22.5)) {
//     return 0;  // North (N) → No change
//   } else if (windDirection >= 22.5 && windDirection < 67.5) {
//     return 2;  // North-East (NE) → Slightly up
//   } else if (windDirection >= 67.5 && windDirection < 112.5) {
//     return 4;  // East (E) → Higher pitch
//   } else if (windDirection >= 112.5 && windDirection < 157.5) {
//     return 2;  // South-East (SE) → Slightly up
//   } else if (windDirection >= 157.5 && windDirection < 202.5) {
//     return -3; // South (S) → Lower pitch
//   } else if (windDirection >= 202.5 && windDirection < 247.5) {
//     return -2; // South-West (SW) → Slightly down
//   } else if (windDirection >= 247.5 && windDirection < 292.5) {
//     return -4; // West (W) → Deeper tone
//   } else {
//     return -1; // North-West (NW) → Slightly down
//   }
// }

function getWindDirectionLabel(windDirection: number): { label: string; transposition: number } {
  if ((windDirection >= 337.5 && windDirection <= 360) || (windDirection >= 0 && windDirection < 22.5)) {
    return { label: "North", transposition: 0 };
  } else if (windDirection >= 22.5 && windDirection < 67.5) {
    return { label: "North-East", transposition: 2 };
  } else if (windDirection >= 67.5 && windDirection < 112.5) {
    return { label: "East", transposition: 4 };
  } else if (windDirection >= 112.5 && windDirection < 157.5) {
    return { label: "South-East", transposition: 2 };
  } else if (windDirection >= 157.5 && windDirection < 202.5) {
    return { label: "South", transposition: -3 };
  } else if (windDirection >= 202.5 && windDirection < 247.5) {
    return { label: "South-West", transposition: -2 };
  } else if (windDirection >= 247.5 && windDirection < 292.5) {
    return { label: "West", transposition: -4 };
  } else {
    return { label: "North-West", transposition: -1 };
  }
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
      return "Overcast";
  }
}
