// 'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, Snowflake, Wind, ArrowLeft } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function WeatherApp() {
  const [location, setLocation] = useState('')
  const [weather, setWeather] = useState(null)
  const [audio] = useState(typeof Audio !== 'undefined' ? new Audio('/ambient-weather.mp3') : null)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, you would fetch weather data here
    setWeather({
      temperature: 22,
      condition: 'Windy',
      humidity: 60,
      windSpeed: 5
    })
    if (audio) {
      audio.loop = true
      audio.play()
    }
  }

  const resetLocation = () => {
    setWeather(null)
    setLocation('')
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Sunny':
        return <Sun className="w-24 h-24 text-black" />
      case 'Rainy':
        return <CloudRain className="w-24 h-24" />
      case 'Snowy':
        return <Snowflake className="w-24 h-24" />
      case 'Windy':
        return <Wind className="w-24 h-24" />
      default:
        return <Cloud className="w-24 h-24" />
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white text-black">
      <div className="w-full max-w-md p-8 rounded-lg border border-black">
        {!weather ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-3xl font-bold text-center mb-8 font-mono">WEATHER NOW</h1>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city name"
              className="w-full bg-white border-black text-black font-mono"
            />
            <Button type="submit" className="w-full bg-blue-100 hover:bg-blue-200 text-black font-mono">
              GET WEATHER
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <Button
              onClick={resetLocation}
              className="absolute top-4 right-4 bg-white text-black hover:bg-blue-100 border border-black"
              aria-label="Return to location input"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-3xl font-bold mb-8 font-mono uppercase">{location}</h2>
            <div className="flex justify-center mb-8">
              {getWeatherIcon(weather.condition)}
            </div>
            <p className="text-6xl font-bold mb-6 font-mono">{weather.temperature}°C</p>
            <p className="text-2xl mb-4 font-mono uppercase">{weather.condition}</p>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <p>HUMIDITY: {weather.humidity}%</p>
              <p>WIND: {weather.windSpeed} KM/H</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
