// import express, { Request, Response } from 'express';

// const app = express();

// // Example route
// app.get('/api/weather', async (req: Request, res: Response) => {
//   try {
//     const weatherData = { temperature: 22, condition: 'Sunny' }; // Example response
//     res.json(weatherData); // Send JSON response
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// import { startAudioEngine } from './audioEngine/audio'; // Adjust the path as necessary
// import { getWeather } from './weather'; // Your weather fetching logic

// document.getElementById("get-weather")?.addEventListener("click", async () => {
//   try {
//     // Initialize the audio engine
//     await startAudioEngine();

//     // Fetch weather for Amsterdam (default latitude and longitude)
//     const amsterdamCoords = { latitude: 52.3676, longitude: 4.9041 };
//     const weatherData = await getWeather(amsterdamCoords.latitude, amsterdamCoords.longitude);

//     console.log("Weather Data:", weatherData);

//     // TODO: Use weather data to influence sound properties
//   } catch (error) {
//     console.error("Error fetching weather or initializing audio:", error);
//   }
// });
