package com.example.leave_management.service;

import com.example.leave_management.dto.weather.WeatherResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    private final RestClient restClient;



    public WeatherService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.open-meteo.com")
                .build();
    }

    public WeatherResponse getWeather(
            double latitude,
            double longitude,
            String location
    ) {

        Map<?, ?> response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1/forecast")
                        .queryParam("latitude", latitude)
                        .queryParam("longitude", longitude)
                        .queryParam(
                                "current",
                                "temperature_2m," +
                                        "relative_humidity_2m," +
                                        "apparent_temperature," +
                                        "precipitation," +
                                        "weather_code," +
                                        "wind_speed_10m," +
                                        "is_day"
                        )
                        .queryParam(
                                "daily",
                                "weather_code," +
                                        "temperature_2m_max," +
                                        "temperature_2m_min," +
                                        "precipitation_probability_max," +
                                        "sunrise," +
                                        "sunset"
                        )
                        .queryParam("forecast_days", 5)
                        .queryParam("timezone", "auto")
                        .queryParam("temperature_unit", "celsius")
                        .queryParam("wind_speed_unit", "kmh")
                        .queryParam("precipitation_unit", "mm")
                        .build())
                .retrieve()
                .body(Map.class);

        Map<?, ?> current =
                (Map<?, ?>) response.get("current");

        Map<?, ?> daily =
                (Map<?, ?>) response.get("daily");

        List<String> dates =
                (List<String>) daily.get("time");

        List<Double> maxTemps =
                (List<Double>) daily.get("temperature_2m_max");

        List<Double> minTemps =
                (List<Double>) daily.get("temperature_2m_min");

        List<Integer> precipitation =
                (List<Integer>) daily.get("precipitation_probability_max");

        List<Integer> weatherCodes =
                (List<Integer>) daily.get("weather_code");

        List<String> sunrise =
                (List<String>) daily.get("sunrise");

        List<String> sunset =
                (List<String>) daily.get("sunset");

        List<WeatherResponse.DailyWeather> forecast =
                new ArrayList<>();

        for (int i = 0; i < dates.size(); i++) {
            forecast.add(
                    new WeatherResponse.DailyWeather(
                            dates.get(i),
                            maxTemps.get(i),
                            minTemps.get(i),
                            precipitation.get(i),
                            weatherCodes.get(i),
                            sunrise.get(i),
                            sunset.get(i)
                    )
            );
        }

        return new WeatherResponse(
                location,
                new WeatherResponse.CurrentWeather(
                        ((Number) current.get("temperature_2m")).doubleValue(),
                        ((Number) current.get("apparent_temperature")).doubleValue(),
                        ((Number) current.get("relative_humidity_2m")).intValue(),
                        ((Number) current.get("wind_speed_10m")).doubleValue(),
                        ((Number) current.get("precipitation")).doubleValue(),
                        ((Number) current.get("weather_code")).intValue(),
                        ((Number) current.get("is_day")).intValue() == 1
                ),
                forecast
        );
    }
}