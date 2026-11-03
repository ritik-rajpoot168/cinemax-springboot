package com.cinemax.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {
    @GetMapping("/")
    public Map<String,Object> root() {
        return Map.of("status", "ok", "service", "CineMax Backend API",
                "message", "Backend is running. Use /api/health or /api/movies for API data.",
                "endpoints", Map.of("health", "/api/health", "movies", "/api/movies",
                        "theatres", "/api/theatres", "recommendations", "/api/recommendations"));
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
