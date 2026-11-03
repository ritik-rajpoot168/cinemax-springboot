package com.cinemax.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record MovieRequest(@NotBlank String title, String description, Integer durationMinutes, String language,
                           Double rating, String posterUrl, String backdropUrl, LocalDate releaseDate,
                           Boolean nowShowing, List<String> genres) {}
