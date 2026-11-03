package com.cinemax.controller;

import com.cinemax.dto.MovieRequest;
import com.cinemax.dto.ShowTimeRequest;
import com.cinemax.model.BookingView;
import com.cinemax.model.Movie;
import com.cinemax.model.ShowTime;
import com.cinemax.repository.BookingRepository;
import com.cinemax.service.BookingService;
import com.cinemax.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin dashboard - every route here requires the ADMIN role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final CatalogService catalog;
    private final BookingService bookings;
    private final BookingRepository bookingRepo;

    public AdminController(CatalogService catalog, BookingService bookings, BookingRepository bookingRepo) {
        this.catalog = catalog;
        this.bookings = bookings;
        this.bookingRepo = bookingRepo;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return bookingRepo.stats();
    }

    @PostMapping("/movies")
    @ResponseStatus(HttpStatus.CREATED)
    public Movie addMovie(@Valid @RequestBody MovieRequest r) {
        return catalog.createMovie(r);
    }

    @PutMapping("/movies/{id}")
    public Movie updateMovie(@PathVariable long id, @Valid @RequestBody MovieRequest r) {
        return catalog.updateMovie(id, r);
    }

    @DeleteMapping("/movies/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMovie(@PathVariable long id) {
        catalog.deleteMovie(id);
    }

    @PostMapping("/showtimes")
    @ResponseStatus(HttpStatus.CREATED)
    public ShowTime addShowTime(@Valid @RequestBody ShowTimeRequest r) {
        return catalog.createShowTime(r);
    }

    @GetMapping("/bookings")
    public List<BookingView> allBookings() {
        return bookings.allBookings();
    }
}
