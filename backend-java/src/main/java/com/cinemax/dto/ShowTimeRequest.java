package com.cinemax.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowTimeRequest(@NotNull Long movieId, @NotBlank String screen,
                              @NotNull LocalDateTime startTime, @NotNull @Positive BigDecimal price) {}
