import { useState } from 'react';
import { getWeather } from '../../api/weather'; // Adjust the path as needed
import { Cloud, Sun, CloudRain, Snowflake, Wind, ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export default function WeatherInSound() {
  const [location, setLocation] = useState('Amsterdam');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [audio] = useState(typeof Audio !== 'undefined' ? new Audio('/ambient-weather.mp3') : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Replace this with real latitude and longitude retrieval logic
      // const { latitude, longitude } = await getCoordinates(location);
      const latitude = 52.38; // Temporary Amsterdam latitude
      const longitude = 4.9; // Temporary Amsterdam longitude
      const weatherData = await getWeather(latitude, longitude);

      setWeather({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
      });

      if (audio) {
        audio.loop = true;
        audio.play();
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      alert("Failed to fetch weather data. Please try again.");
    }
  };

  const resetLocation = () => {
    setWeather(null);
    setLocation('');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
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
          <form onSubmit={handleSubmit} className="space-y-12">
            <h1 className="text-6xl text-center text-[#1a2e44] mb-16">WEATHER NOW</h1>
            <div className="space-y-4">
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city name"
                className="w-full h-12 px-4 text-lg border border-[#1a2e44] rounded-none bg-white text-[#1a2e44] placeholder:text-[#1a2e44]/50"
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg bg-[#f5f5f5] hover:bg-[#e5e5e5] text-[#1a2e44] rounded-none border border-[#1a2e44]"
              >
                GET WEATHER
              </Button>
            </div>
          </form>
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
