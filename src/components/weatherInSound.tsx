import { useState, useEffect } from 'react';
import { getWeather } from '../../server/weather';
import { Cloud, Sun, CloudRain, Snowflake, Wind, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  initializeAudioEngine,
  playWeatherSound,
  stopWeatherSound,
  cleanupAudioEngine,
  muteAudio,
  unmuteAudio
} from '../../server/audio/weather-audio-bridges';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  transposition: number;
  airPressure: number;
}

interface Locations {
  city: string;
  long: number;
  lat: number;
  feature: string;
}

const locations: Locations[] = [
  // Well-known cities
  { city: "New York", lat: 40.7128, long: -74.0060, feature: "" },
  { city: "London", lat: 51.5074, long: -0.1278, feature: "" },
  { city: "Berlin", lat: 52.5200, long: 13.4050, feature: "" },
  { city: "Tokyo", lat: 35.6762, long: 139.6503, feature: "" },
  { city: "Sao Paulo", lat: -23.5505, long: -46.6333, feature: "" },
  { city: "Mexico City", lat: 19.4326, long: -99.1332, feature: "" },
  { city: "Cairo", lat: 30.0444, long: 31.2357, feature: "" },
  { city: "New Delhi", lat: 28.6139, long: 77.2090, feature: "" },
  { city: "Beijing", lat: 39.9042, long: 116.4074, feature: "" },
  // Original cities with special features
  { city: "Amsterdam", lat: 52.3676, long: 4.9041, feature: "Home" },
  { city: "Arica", lat: -18.4783, long: -70.3211, feature: "Driest city in the world" },
  { city: "Kuwait City", lat: 29.3759, long: 47.9774, feature: "One of the hottest cities" },
  { city: "Dakhla", lat: 23.6848, long: -15.9570, feature: "One of the driest places & heavy desert winds" },
  { city: "Mawsynram", lat: 25.2986, long: 91.5822, feature: "Wettest place on Earth" },
  { city: "Wellington", lat: -41.2865, long: 174.7762, feature: "Windiest city" },
  { city: "Utqiagvik", lat: 71.2906, long: -156.7886, feature: "Extreme cold & polar night" },
  { city: "Jakarta", lat: -6.2088, long: 106.8456, feature: "One of the most humid cities" },
  { city: "La Paz", lat: -16.5000, long: -68.1500, feature: "Highest capital city (3,650m)" },
];


export default function WeatherInSound() {
  const [selectedLocation, setSelectedLocation] = useState<Locations | null>(null);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

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
        transposition: weatherData.transposition,
        airPressure: weatherData.airPressure
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
        airPressure: weather.airPressure,
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
    setMuted(false);
    stopWeatherSound();
    cleanupAudioEngine();
  };

  const handleToggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    if (newMutedState) {
      muteAudio();
    } else {
      unmuteAudio();
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'Sunny':
        return <Sun className="w-24 h-24 text-foreground" />;
      case 'Rainy':
        return <CloudRain className="w-24 h-24 text-foreground" />;
      case 'Snowy':
        return <Snowflake className="w-24 h-24 text-foreground" />;
      case 'Windy':
        return <Wind className="w-24 h-24 text-foreground" />;
      default:
        return <Cloud className="w-24 h-24 text-foreground" />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground relative">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-border">
        {!weather ? (
          <div className="space-y-12">
            <h1 className="text-7xl font-bold text-center text-foreground mb-16">WEATHER IN SOUND</h1>
            <div className="grid grid-cols-3 gap-2 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              {locations.map((loc) => (
                <Popover
                  key={loc.city}
                  open={hoveredCity === loc.city}
                  onOpenChange={() => {}}
                >
                  <PopoverTrigger asChild>
                    <Button
                      onClick={() => handleLocationSelect(loc)}
                      disabled={loading}
                      variant={selectedLocation?.city === loc.city ? "default" : "outline"}
                      className="w-full h-12 text-sm"
                      onMouseEnter={() => setHoveredCity(loc.city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      {loc.city}
                    </Button>
                  </PopoverTrigger>
                  {loc.feature && (
                    <PopoverContent side="top" className="w-48 pointer-events-none select-none" sideOffset={8} align="center">
                      <span className="text-sm text-center block">{loc.feature}</span>
                    </PopoverContent>
                  )}
                </Popover>
              ))}
            </div>
            {error && <p className="text-destructive text-center mt-4">{error}</p>}
          </div>
        ) : (
          <>
            <Button
              onClick={resetLocation}
              variant="outline"
              className="absolute top-4 right-4"
              aria-label="Return to location input"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="text-center w-full">
            <h2 className="text-3xl font-bold mb-8 text-foreground uppercase">{location}</h2>
            <div className="flex justify-center mb-8">
              {getWeatherIcon(weather.condition)}
            </div>
            <p className="text-6xl font-bold mb-6 text-foreground">{weather.temperature}°C</p>
            <p className="text-2xl mb-4 text-foreground uppercase">{weather.condition}</p>
            <div className="grid grid-cols-3 gap-4 text-sm text-foreground mb-8">
              <p>HUMIDITY: {weather.humidity}%</p>
              <p>WIND: {weather.windSpeed} KM/H</p>
              <p>AIR PRESSURE: {weather.airPressure} hPa ({Math.round((weather.airPressure / 1013.25) * 100)}%)</p>
            </div>
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleToggleMute}
                variant="outline"
                aria-label={muted ? "Unmute audio" : "Mute audio"}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
