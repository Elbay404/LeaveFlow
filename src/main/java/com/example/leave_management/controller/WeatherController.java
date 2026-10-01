package com.example.leave_management.controller;

import com.example.leave_management.dto.weather.WeatherResponse;
import com.example.leave_management.service.WeatherService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

 /*   public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }*/

    @GetMapping
    public WeatherResponse getWeather(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "Tunis") String location
    ) {
        return weatherService.getWeather(
                latitude,
                longitude,
                location
        );
    }
}