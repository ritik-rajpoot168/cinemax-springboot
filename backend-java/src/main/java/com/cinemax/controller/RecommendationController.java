package com.cinemax.controller;

import com.cinemax.model.Movie;
import com.cinemax.service.CatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/** Public (no login) movie discovery - same two endpoints as the Node.js version. */
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final CatalogService catalog;

    public RecommendationController(CatalogService catalog) {
        this.catalog = catalog;
    }

    /** GET /api/recommendations?genres=Action,Sci-Fi */
    @GetMapping
    public List<Movie> recommend(@RequestParam(required = false) String genres) {
        List<String> list = (genres == null || genres.isBlank()) ? List.of()
                : Arrays.stream(genres.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return catalog.recommend(list);
    }

    /** GET /api/recommendations/genres */
    @GetMapping("/genres")
    public List<String> genres() {
        return catalog.genres();
    }
}
