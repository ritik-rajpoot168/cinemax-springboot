package com.cinemax.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingView(long id, String userEmail, String movieTitle, String screen,
                          LocalDateTime startTime, List<String> seats, BigDecimal totalAmount,
                          String paymentStatus, LocalDateTime createdAt) {
    @JsonProperty("_id")
    public long legacyId() { return id; }
}
