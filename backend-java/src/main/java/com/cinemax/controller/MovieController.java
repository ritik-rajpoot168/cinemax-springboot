package com.cinemax.controller;

import com.cinemax.model.Movie;
import com.cinemax.model.ShowTime;
import com.cinemax.service.CatalogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
public class MovieController {
    private final CatalogService catalog;

    public MovieController(CatalogService catalog) {
        this.catalog = catalog;
    }

    /** Browse all movies with filters: ?genre=Action&language=English&q=dark&nowShowing=true */
    @GetMapping
    public List<Movie> list(@RequestParam(required = false) String genre,
                            @RequestParam(required = false) String language,
                            @RequestParam(required = false) String q,
                            @RequestParam(required = false) Boolean nowShowing) {
        return catalog.listMovies(genre, language, q, nowShowing);
    }

    @GetMapping("/{id}")
    public Movie get(@PathVariable long id) {
        return catalog.getMovie(id);
    }

    @GetMapping("/{id}/showtimes")
    public List<ShowTime> showTimes(@PathVariable long id) {
        return catalog.showTimesForMovie(id);
    }
}
