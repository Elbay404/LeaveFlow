package com.example.leave_management.dto.weather;

import java.util.List;

public record WeatherResponse(
        String location,
        CurrentWeather current,
        List<DailyWeather> daily
) {

    public record CurrentWeather(
            double temperature,
            double apparentTemperature,
            int humidity,
            double windSpeed,
            double precipitation,
            int weatherCode,
            boolean isDay
    ) {}

    public record DailyWeather(
            String date,
            double maxTemperature,
            double minTemperature,
            int precipitationProbability,
            int weatherCode,
            String sunrise,
            String sunset
    ) {}
}