package com.cinemax.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.util.List;

public record Movie(long id, String title, String description, int durationMinutes, String language,
                    double rating, String posterUrl, String backdropUrl, LocalDate releaseDate,
                    boolean nowShowing, List<String> genres) {
    /** Keeps the "_id" field name the old MongoDB-based React frontend expects. */
    @JsonProperty("_id")
    public long legacyId() { return id; }
}
