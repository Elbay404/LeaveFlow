"use client";

import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  Droplets,
  Wind,
  Sunrise,
  Sunset,
  RefreshCw,
  MapPin,
  Umbrella,
} from "lucide-react";

export type Weather = {
  location: string;
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    isDay: boolean;
  };
  daily: {
    date: string;
    maxTemperature: number;
    minTemperature: number;
    precipitationProbability: number;
    weatherCode: number;
    sunrise: string;
    sunset: string;
  }[];
};

type WeatherCardProps = {
  weather: Weather | null;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
};

function getWeatherInfo(code: number, isDay = true) {
  if (code === 0) {
    return {
      label: isDay ? "Clear sky" : "Clear night",
      icon: isDay ? Sun : Moon,
    };
  }

  if (code === 1) {
    return {
      label: "Mainly clear",
      icon: isDay ? Sun : Moon,
    };
  }

  if (code === 2) {
    return {
      label: "Partly cloudy",
      icon: CloudSun,
    };
  }

  if (code === 3) {
    return {
      label: "Overcast",
      icon: Cloud,
    };
  }

  if (code === 45 || code === 48) {
    return {
      label: "Foggy",
      icon: CloudFog,
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      label: "Drizzle",
      icon: CloudDrizzle,
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      label: "Rainy",
      icon: CloudRain,
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      label: "Snow",
      icon: CloudSnow,
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      label: "Thunderstorm",
      icon: CloudLightning,
    };
  }

  return {
    label: "Unknown",
    icon: CloudSun,
  };
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Today";

  if (index === 1) return "Tomorrow";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function WeatherCard({
  weather,
  loading,
  error,
  onRefresh,
}: WeatherCardProps) {
  if (loading) {
    return (
      <div className="relative min-h-[390px] overflow-hidden rounded-[28px] bg-slate-950 p-5 shadow-2xl">
        <div className="absolute -right-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />

        <div className="absolute -bottom-24 -left-24 h-72 w-72 animate-pulse rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 animate-pulse">
          <div className="h-5 w-32 rounded bg-white/10" />

          <div className="mt-12 h-20 w-40 rounded bg-white/10" />

          <div className="mt-4 h-5 w-28 rounded bg-white/10" />

          <div className="mt-12 grid grid-cols-3 gap-3">
            <div className="h-20 rounded-2xl bg-white/10" />
            <div className="h-20 rounded-2xl bg-white/10" />
            <div className="h-20 rounded-2xl bg-white/10" />
          </div>

          <div className="mt-6 h-28 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex min-h-[390px] flex-col items-center justify-center overflow-hidden rounded-[28px] bg-slate-950 p-6 text-center text-white shadow-2xl">
        <Cloud className="mb-4 h-14 w-14 text-slate-500" />

        <h3 className="text-lg font-bold">
          Weather unavailable
        </h3>

        <p className="mt-2 max-w-xs text-sm text-slate-400">
          We couldn't load the current weather information.
        </p>

        <button
          onClick={onRefresh}
          className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  }

  const current = weather.current;
  const today = weather.daily[0];

  const currentInfo = getWeatherInfo(
    current.weatherCode,
    current.isDay
  );

  const CurrentIcon = currentInfo.icon;

  const sunrise = new Date(today.sunrise).getTime();
  const sunset = new Date(today.sunset).getTime();
  const now = Date.now();

  const daylightProgress = Math.min(
    100,
    Math.max(
      0,
      ((now - sunrise) / (sunset - sunrise)) * 100
    )
  );

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[28px] bg-slate-950 text-white shadow-2xl">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div
          className={`absolute -right-24 -top-28 h-80 w-80 rounded-full blur-3xl ${
            current.isDay
              ? "bg-amber-400/20"
              : "bg-indigo-500/20"
          }`}
        />

        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

        {current.isDay && (
          <>
            <div className="absolute right-16 top-16 h-32 w-32 animate-pulse rounded-full bg-amber-300/10 blur-2xl" />

            <div className="absolute right-[108px] top-[108px] h-16 w-16 animate-ping rounded-full bg-amber-200/5" />
          </>
        )}

        {!current.isDay && (
          <>
            <span className="absolute right-28 top-20 h-1 w-1 animate-pulse rounded-full bg-white/80" />

            <span className="absolute right-48 top-32 h-1 w-1 animate-pulse rounded-full bg-white/60" />

            <span className="absolute right-20 top-44 h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />

            <span className="absolute right-64 top-24 h-1 w-1 rounded-full bg-white/50" />
          </>
        )}
      </div>

      <div className="relative z-10 p-5">

        {/* Header */}
        <div className="flex items-start justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <MapPin className="h-5 w-5 text-blue-400" />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                {weather.location}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Live weather
              </p>
            </div>

          </div>

          <button
            onClick={onRefresh}
            className="group rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:bg-white/10"
            title="Refresh weather"
          >
            <RefreshCw className="h-4 w-4 text-slate-300 transition group-hover:rotate-180" />
          </button>

        </div>

        {/* Main weather */}
        <div className="mt-5 flex min-h-[125px] items-center justify-between">

          <div>

            <div className="flex items-start">

              <span className="text-[76px] font-black leading-[0.85] tracking-[-0.08em] text-white">
                {Math.round(current.temperature)}
              </span>

              <span className="ml-2 mt-1 text-3xl font-semibold text-slate-400">
                °C
              </span>

            </div>

            <p className="mt-3 text-xl font-bold tracking-tight text-white">
              {currentInfo.label}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Feels like{" "}
              <span className="font-semibold text-slate-300">
                {Math.round(current.apparentTemperature)}°C
              </span>
            </p>

          </div>

          {/* Main weather icon */}
          <div className="relative mr-4 flex h-28 w-28 items-center justify-center">

            <div className="absolute inset-0 animate-pulse rounded-full bg-amber-400/10 blur-3xl" />

            <div className="absolute h-24 w-24 rounded-full bg-amber-400/5 blur-xl" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">

              <CurrentIcon
                className={`h-12 w-12 ${
                  current.isDay
                    ? "text-amber-300"
                    : "text-indigo-200"
                }`}
                strokeWidth={1.4}
              />

            </div>

          </div>

        </div>

        {/* Metrics */}
        <div className="mt-4 grid grid-cols-3 gap-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">

            <Droplets className="h-4 w-4 text-cyan-300" />

            <p className="mt-3 text-xs text-slate-500">
              Humidity
            </p>

            <p className="mt-1 text-sm font-bold">
              {current.humidity}%
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">

            <Wind className="h-4 w-4 text-blue-300" />

            <p className="mt-3 text-xs text-slate-500">
              Wind
            </p>

            <p className="mt-1 text-sm font-bold">
              {Math.round(current.windSpeed)} km/h
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">

            <Umbrella className="h-4 w-4 text-purple-300" />

            <p className="mt-3 text-xs text-slate-500">
              Rain
            </p>

            <p className="mt-1 text-sm font-bold">
              {today.precipitationProbability}%
            </p>

          </div>

        </div>

        {/* Sunrise / Sunset */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Sunrise className="h-4 w-4 text-amber-300" />

              <div>

                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Sunrise
                </p>

                <p className="text-xs font-semibold">
                  {formatTime(today.sunrise)}
                </p>

              </div>

            </div>

            <div className="mx-4 flex-1">

              <div className="relative h-1.5 rounded-full bg-white/10">

                <div
                  className="absolute left-0 top-0 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-amber-300 to-orange-400 transition-all duration-1000"
                  style={{
                    width: `${daylightProgress}%`,
                  }}
                />

                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-amber-300 shadow-lg shadow-amber-300/40 transition-all duration-1000"
                  style={{
                    left: `${daylightProgress}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />

              </div>

            </div>

            <div className="flex items-center gap-2">

              <div className="text-right">

                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Sunset
                </p>

                <p className="text-xs font-semibold">
                  {formatTime(today.sunset)}
                </p>

              </div>

              <Sunset className="h-4 w-4 text-orange-300" />

            </div>

          </div>

        </div>

        {/* 5 Day Forecast */}
        <div className="mt-3">

          <div className="mb-2 flex items-center justify-between">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              5 day forecast
            </p>

            <span className="text-[10px] text-slate-600">
              Updated now
            </span>

          </div>

          <div className="grid grid-cols-5 gap-2">

            {weather.daily.map((day, index) => {

              const info = getWeatherInfo(
                day.weatherCode,
                true
              );

              const Icon = info.icon;

              return (
                <div
                  key={day.date}
                  className={`rounded-2xl border px-2 py-2.5 text-center transition ${
                    index === 0
                      ? "border-blue-400/20 bg-blue-500/10"
                      : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >

                  {/* Day */}
                  <p className="text-[10px] font-semibold text-slate-400">
                    {formatDay(day.date, index)}
                  </p>

                  {/* Weather icon */}
                  <Icon className="mx-auto my-2 h-5 w-5 text-amber-300" />

                  {/* Maximum temperature */}
                  <p className="text-lg font-extrabold leading-none text-white">
                    {Math.round(day.maxTemperature)}°
                  </p>

                  {/* Minimum temperature */}
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {Math.round(day.minTemperature)}°
                  </p>

                  {/* Rain probability */}
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-cyan-300">

                    <Droplets className="h-2.5 w-2.5" />

                    {day.precipitationProbability}%

                  </div>

                </div>
              );
            })}

          </div>

        </div>

      </div>
    </div>
  );
}