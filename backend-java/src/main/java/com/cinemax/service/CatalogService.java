package com.cinemax.service;

import com.cinemax.dto.MovieRequest;
import com.cinemax.dto.ShowTimeRequest;
import com.cinemax.exception.ApiException;
import com.cinemax.model.Movie;
import com.cinemax.model.Seat;
import com.cinemax.model.ShowTime;
import com.cinemax.repository.MovieRepository;
import com.cinemax.repository.ShowTimeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Movies, recommendations, show times and seat maps. */
@Service
public class CatalogService {
    private final MovieRepository movies;
    private final ShowTimeRepository showTimes;

    public CatalogService(MovieRepository movies, ShowTimeRepository showTimes) {
        this.movies = movies;
        this.showTimes = showTimes;
    }

    public List<Movie> listMovies(String genre, String language, String q, Boolean nowShowing) {
        return movies.search(genre, language, q, nowShowing);
    }

    public Movie getMovie(long id) {
        return movies.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Movie not found"));
    }

    /** Letterboxd-style discovery: any selected genre matches, ranked by rating. */
    public List<Movie> recommend(List<String> genres) {
        return movies.recommend(genres);
    }

    public List<String> genres() {
        return movies.allGenres();
    }

    public List<ShowTime> showTimesForMovie(long movieId) {
        getMovie(movieId);
        return showTimes.findUpcomingByMovie(movieId);
    }

    public ShowTime getShowTime(long id) {
        return showTimes.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Show not found"));
    }

    public List<Seat> seatMap(long showTimeId) {
        getShowTime(showTimeId);
        return showTimes.findSeats(showTimeId);
    }

    // ---- admin ----
    public Movie createMovie(MovieRequest r) {
        return getMovie(movies.create(r));
    }

    public Movie updateMovie(long id, MovieRequest r) {
        if (!movies.update(id, r)) throw new ApiException(HttpStatus.NOT_FOUND, "Movie not found");
        return getMovie(id);
    }

    public void deleteMovie(long id) {
        if (!movies.delete(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Movie not found");
    }

    @Transactional
    public ShowTime createShowTime(ShowTimeRequest r) {
        getMovie(r.movieId());
        long id = showTimes.create(r.movieId(), r.screen(), r.startTime(), r.price());
        return getShowTime(id);
    }
}
