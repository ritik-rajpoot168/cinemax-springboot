package com.cinemax.controller;

import com.cinemax.model.Seat;
import com.cinemax.model.ShowTime;
import com.cinemax.service.CatalogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
public class ShowTimeController {
    private final CatalogService catalog;

    public ShowTimeController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/{id}")
    public ShowTime get(@PathVariable long id) {
        return catalog.getShowTime(id);
    }

    /** Seat selection page: every seat with AVAILABLE / BOOKED status. */
    @GetMapping("/{id}/seats")
    public List<Seat> seats(@PathVariable long id) {
        return catalog.seatMap(id);
    }
}
