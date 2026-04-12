# Weather in Sound

## Introduction

**Weather in Sound** is a web app that turns live weather into sound. Pick a city from a curated list (from everyday places to extreme climates), and the app loads current conditions and drives an audio engine built with [Tone.js](https://tonejs.github.io/). Temperature, humidity, wind, precipitation, cloud cover, and related signals shape the soundscape so you can *hear* the weather, not only read it. The UI is built with React, TypeScript, and Tailwind CSS (including Radix-based components).

Weather data comes from the free [Open-Meteo](https://open-meteo.com/) forecast API (no API key required for typical use).

---

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (comes with Node)

## Installation

```bash
git clone <repository-url>
cd weather-in-sound
npm install
```

## Development

Start the Vite dev server with hot module replacement:

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build and preview

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Linting

```bash
npm run lint
```

## Scripts

| Script        | Description                          |
| ------------- | ------------------------------------ |
| `npm run dev` | Start development server             |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint on the project          |

## Tech stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI primitives, Lucide icons
- **Audio:** Tone.js
- **Visualization:** D3 (where used in the UI)
- **Weather:** Open-Meteo HTTP API (client-side fetch via shared `server/` modules)

## Project layout (overview)

- `src/` — React app entry, components, and styles
- `server/` — Weather fetching, audio bridges, and related logic shared with the client build

## Data and attribution

Forecast data is provided by [Open-Meteo](https://open-meteo.com/). Their service aggregates multiple weather models; refer to their documentation for licensing and attribution if you redistribute or commercialize derived work.

## License

This project is marked `private` in `package.json`. Add a `LICENSE` file and update this section if you publish the repository.
