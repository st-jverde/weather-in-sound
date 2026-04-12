const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

/** `precipitation`: rain, showers, snow, hail, etc. (mm water equivalent) over `current.interval` (~15 min). */
const CURRENT_PARAMS = [
  "temperature_2m",
  "relative_humidity_2m",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "wind_speed_10m",
  "wind_direction_10m",
  "surface_pressure",
] as const;

/** Normalized current weather from Open-Meteo — explicit so callers (e.g. UI) always see `cloudCover` etc. */
export interface WeatherFetchResult {
  temperature: number;
  humidity: number;
  isDay: number;
  /**
   * Total precipitation in mm for the API’s current look-back window (rain, showers, snow, hail, etc. as water equivalent).
   * Passed through the app as `rain` for audio params / minimal churn.
   */
  rain: number;
  condition: string;
  cloudCover: number;
  windSpeed: number;
  windDirection: string;
  transposition: number;
  airPressure: number;
}

export interface GetWeatherOptions {
  /** When aborted, the in-flight request is cancelled (e.g. user picked another city). */
  signal?: AbortSignal;
}

interface OpenMeteoForecastJson {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    is_day?: number;
    precipitation?: number;
    weather_code?: number;
    cloud_cover?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    surface_pressure?: number;
  };
  reason?: string;
}

function mergeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const anyFn = (
    AbortSignal as typeof AbortSignal & { any?: (signals: AbortSignal[]) => AbortSignal }
  ).any;
  if (typeof anyFn === "function") {
    return anyFn.call(AbortSignal, [a, b]);
  }
  const out = new AbortController();
  if (a.aborted) {
    out.abort(a.reason);
    return out.signal;
  }
  if (b.aborted) {
    out.abort(b.reason);
    return out.signal;
  }
  const forward = (source: AbortSignal) => {
    out.abort(source.reason);
  };
  a.addEventListener("abort", () => forward(a), { once: true });
  b.addEventListener("abort", () => forward(b), { once: true });
  return out.signal;
}

function createTimeoutSignal(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => {
    controller.abort(new DOMException("Request timed out", "TimeoutError"));
  }, ms);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(id),
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(id);
      reject(signal!.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

/** After `fetch` aborts, engines often report `AbortError` even when the underlying reason was a timeout. */
function causedByTimeout(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "TimeoutError") return true;
  if (e instanceof DOMException && e.name === "AbortError") {
    const c = (e as DOMException & { cause?: unknown }).cause;
    if (c instanceof DOMException && c.name === "TimeoutError") return true;
  }
  return false;
}

function shouldRetryHttp(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function mapCurrentToResult(current: NonNullable<OpenMeteoForecastJson["current"]>): WeatherFetchResult {
  if (
    current.temperature_2m === undefined ||
    current.relative_humidity_2m === undefined ||
    current.is_day === undefined ||
    current.precipitation === undefined ||
    current.weather_code === undefined ||
    current.cloud_cover === undefined ||
    current.wind_speed_10m === undefined ||
    current.wind_direction_10m === undefined ||
    current.surface_pressure === undefined
  ) {
    throw new Error("Current weather data is not available");
  }

  const windInfo = getWindDirectionLabel(current.wind_direction_10m);

  // `precipitation` includes large-scale rain, convective showers, and snow (as mm water equivalent).
  const precipMm = Math.round(current.precipitation * 10) / 10;

  return {
    temperature: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    isDay: current.is_day,
    rain: precipMm,
    condition: determineCondition(current.weather_code),
    cloudCover: Math.round(current.cloud_cover),
    windSpeed: Math.round(current.wind_speed_10m),
    windDirection: windInfo.label,
    transposition: windInfo.transposition,
    airPressure: Math.round(current.surface_pressure),
  };
}

export async function getWeather(
  latitude: number,
  longitude: number,
  options?: GetWeatherOptions
): Promise<WeatherFetchResult> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: CURRENT_PARAMS.join(","),
  });
  const url = `${BASE_URL}?${params.toString()}`;

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (options?.signal?.aborted) {
      throw options.signal.reason ?? new DOMException("Aborted", "AbortError");
    }

    const { signal: timeoutSignal, cancel: cancelTimeout } = createTimeoutSignal(WEATHER_TIMEOUT_MS);
    const fetchSignal = options?.signal
      ? mergeAbortSignals(options.signal, timeoutSignal)
      : timeoutSignal;

    try {
      const response = await fetch(url, { signal: fetchSignal });
      cancelTimeout();

      if (response.status === 400) {
        const body = (await response.json().catch(() => ({}))) as OpenMeteoForecastJson;
        throw new Error(typeof body.reason === "string" ? body.reason : "Invalid weather request");
      }

      if (!response.ok) {
        if (shouldRetryHttp(response.status) && attempt < MAX_ATTEMPTS - 1) {
          await sleep(BASE_BACKOFF_MS * 2 ** attempt, options?.signal);
          continue;
        }
        throw new Error(`Weather request failed (${response.status})`);
      }

      const data = (await response.json()) as OpenMeteoForecastJson;
      if (!data.current) {
        throw new Error("Current weather data is not available");
      }
      return mapCurrentToResult(data.current);
    } catch (e) {
      cancelTimeout();
      lastError = e;

      if (options?.signal?.aborted || isAbortError(e)) {
        throw options?.signal?.reason ?? e;
      }

      if (causedByTimeout(e) && attempt < MAX_ATTEMPTS - 1) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt, options?.signal);
        continue;
      }

      const retriableNetwork =
        e instanceof TypeError ||
        (e instanceof Error && /network|fetch|failed/i.test(e.message));

      if (retriableNetwork && attempt < MAX_ATTEMPTS - 1) {
        await sleep(BASE_BACKOFF_MS * 2 ** attempt, options?.signal);
        continue;
      }

      throw e;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch weather data");
}

/** User-facing message for location load failures. Returns empty string for request cancellation (`AbortError`). */
export function weatherFetchFailureMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "";
  }
  if (causedByTimeout(error)) {
    return "Weather request timed out. Check your connection and try again.";
  }
  if (error instanceof TypeError) {
    return "Network error. Check your connection and try again.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Failed to fetch weather data. Please try again.";
}

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
