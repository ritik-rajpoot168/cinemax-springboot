package com.cinemax.controller;

import com.cinemax.dto.SeatSelectionRequest;
import com.cinemax.model.BookingView;
import com.cinemax.security.AuthUser;
import com.cinemax.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    /** Checkout page: validates seats, returns Stripe clientSecret. */
    @PostMapping("/checkout")
    public Map<String, Object> checkout(@Valid @RequestBody SeatSelectionRequest r) {
        return service.checkout(r);
    }

    /** Called after payment succeeds: creates the booking and locks the seats. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingView create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody SeatSelectionRequest r) {
        return service.book(user.id(), r);
    }

    /** My bookings page. */
    @GetMapping("/my")
    public List<BookingView> mine(@AuthenticationPrincipal AuthUser user) {
        return service.myBookings(user.id());
    }
}
