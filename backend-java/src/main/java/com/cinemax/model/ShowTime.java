package com.cinemax.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowTime(long id, long movieId, String screen, LocalDateTime startTime,
                       BigDecimal price, int availableSeats) {
    @JsonProperty("_id")
    public long legacyId() { return id; }
}
