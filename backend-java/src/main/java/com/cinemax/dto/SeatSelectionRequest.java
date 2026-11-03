package com.cinemax.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Used for /checkout (paymentRef ignored) and for creating the booking (paymentRef = payment id). */
public record SeatSelectionRequest(@NotNull Long showTimeId, @NotEmpty List<String> seats, String paymentRef) {}
