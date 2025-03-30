import { useState, useEffect } from 'react';
import { getWeather } from '../../server/weather';
import { Cloud, Sun, CloudRain, Snowflake, Wind, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  initializeAudioEngine,
  playWeatherSound,
  stopWeatherSound,
  cleanupAudioEngine
} from '../../server/audio/weather-audio-bridges';

interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  transposition: number;
}

interface Locations {
  city: string;
  long: number;
  lat: number;
}

const locations: Locations[] = [
  { city: "Amsterdam", lat: 52.3676, long: 4.9041 }, // Base city
  { city: "Arica", lat: -18.4783, long: -70.3211 }, // Driest city in the world
  { city: "Kuwait City", lat: 29.3759, long: 47.9774 }, // One of the hottest cities
  { city: "Dakhla", lat: 23.6848, long: -15.9570 }, // One of the driest places in Africa & heavy desert winds
  { city: "Mawsynram", lat: 25.2986, long: 91.5822 }, // Wettest place on Earth
  { city: "Wellington", lat: -41.2865, long: 174.7762 }, // Windiest city
  { city: "Utqiagvik", lat: 71.2906, long: -156.7886 }, // Extreme cold & polar night
  { city: "Jakarta", lat: -6.2088, long: 106.8456 }, // One of the most humid cities
  { city: "La Paz", lat: -16.5000, long: -68.1500 }, // Highest capital city (3,650m)
];


export default function WeatherInSound() {
  const [selectedLocation, setSelectedLocation] = useState<Locations | null>(null);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const handleLocationSelect = async (selectedLoc: Locations) => {
    setSelectedLocation(selectedLoc);
    setLocation(selectedLoc.city);
    setError(null);
    setAudioError(null);
    setLoading(true);

    try {
      if (!audioInitialized) {
        try {
          await initializeAudioEngine();
          setAudioInitialized(true);
        } catch (err) {
          setAudioError('Failed to initialize audio. Please try again.');
          console.log(audioError);
          throw err;
        }
      }

      const weatherData = await getWeather(selectedLoc.lat, selectedLoc.long);
      setWeather({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        transposition: weatherData.transposition
      });

    } catch (err) {
      console.error("Error:", err);
      setError("Failed to fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weather && audioInitialized && selectedLocation) {
      console.log("Updated weather state:", weather);
      playWeatherSound({
        temperature: weather.temperature,
        condition: weather.condition,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        transposition: weather.transposition,
        lat: selectedLocation.lat,
        long: selectedLocation.long
      })
      .catch(err => {
        console.error("Error playing weather sound:", err);
        setAudioError("Error playing sound. Please refresh the page.");
      });
    }
  }, [weather, audioInitialized, selectedLocation]);

  useEffect(() => {
    return () => {
      stopWeatherSound();
      cleanupAudioEngine();
    };
  }, []);

  const resetLocation = () => {
    setWeather(null);
    setLocation('');
    setSelectedLocation(null);
    stopWeatherSound();
    cleanupAudioEngine();
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny':
        return <Sun className="w-24 h-24 text-[#1a2e44]" />;
      case 'Rainy':
        return <CloudRain className="w-24 h-24 text-[#1a2e44]" />;
      case 'Snowy':
        return <Snowflake className="w-24 h-24 text-[#1a2e44]" />;
      case 'Windy':
        return <Wind className="w-24 h-24 text-[#1a2e44]" />;
      default:
        return <Cloud className="w-24 h-24 text-[#1a2e44]" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md p-8">
        {!weather ? (
          <div className="space-y-12">
            <h1 className="text-7xl font-bold text-center text-[#1a2e44] mb-16">WEATHER IN SOUND</h1>
            <div className="grid grid-cols-3 gap-2">
              {locations.map((loc) => (
                <Button
                  key={loc.city}
                  onClick={() => handleLocationSelect(loc)}
                  disabled={loading}
                  variant={selectedLocation?.city === loc.city ? "default" : "outline"}
                  className="w-full h-12 text-sm"
                >
                  {loc.city}
                </Button>
              ))}
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          </div>
        ) : (
          <div className="text-center">
            <Button
              onClick={resetLocation}
              className="absolute top-4 right-4 bg-white hover:bg-[#f5f5f5] text-[#1a2e44] rounded-none border border-[#1a2e44]"
              aria-label="Return to location input"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-3xl font-bold mb-8 text-[#1a2e44] uppercase">{location}</h2>
            <div className="flex justify-center mb-8">
              {getWeatherIcon(weather.condition)}
            </div>
            <p className="text-6xl font-bold mb-6 text-[#1a2e44]">{weather.temperature}°C</p>
            <p className="text-2xl mb-4 text-[#1a2e44] uppercase">{weather.condition}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-[#1a2e44]">
              <p>HUMIDITY: {weather.humidity}%</p>
              <p>WIND: {weather.windSpeed} KM/H</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
