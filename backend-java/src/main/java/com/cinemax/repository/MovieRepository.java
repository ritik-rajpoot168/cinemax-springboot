package com.cinemax.repository;

import com.cinemax.dto.MovieRequest;
import com.cinemax.model.Movie;
import com.cinemax.util.JdbcUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public class MovieRepository {
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    private static final String BASE =
            "SELECT m.*, (SELECT GROUP_CONCAT(g.genre ORDER BY g.genre SEPARATOR ',') "
          + "FROM movie_genres g WHERE g.movie_id = m.id) AS genres FROM movies m";

    private static final RowMapper<Movie> MAPPER = (rs, i) -> {
        String g = rs.getString("genres");
        List<String> genres = (g == null || g.isBlank()) ? List.of() : Arrays.asList(g.split(","));
        Date rd = rs.getDate("release_date");
        return new Movie(rs.getLong("id"), rs.getString("title"), rs.getString("description"),
                rs.getInt("duration_minutes"), rs.getString("language"), rs.getDouble("rating"),
                rs.getString("poster_url"), rs.getString("backdrop_url"),
                rd == null ? null : rd.toLocalDate(), rs.getBoolean("now_showing"), genres);
    };

    public MovieRepository(JdbcTemplate jdbc, NamedParameterJdbcTemplate named) {
        this.jdbc = jdbc;
        this.named = named;
    }

    public List<Movie> search(String genre, String language, String q, Boolean nowShowing) {
        StringBuilder sql = new StringBuilder(BASE).append(" WHERE 1=1");
        MapSqlParameterSource p = new MapSqlParameterSource();
        if (genre != null && !genre.isBlank()) {
            sql.append(" AND m.id IN (SELECT movie_id FROM movie_genres WHERE genre = :genre)");
            p.addValue("genre", genre);
        }
        if (language != null && !language.isBlank()) {
            sql.append(" AND m.language = :language");
            p.addValue("language", language);
        }
        if (q != null && !q.isBlank()) {
            sql.append(" AND LOWER(m.title) LIKE :q");
            p.addValue("q", "%" + q.toLowerCase() + "%");
        }
        if (nowShowing != null) {
            sql.append(" AND m.now_showing = :ns");
            p.addValue("ns", nowShowing);
        }
        sql.append(" ORDER BY m.rating DESC, m.title");
        return named.query(sql.toString(), p, MAPPER);
    }

    public Optional<Movie> findById(long id) {
        return jdbc.query(BASE + " WHERE m.id = ?", MAPPER, id).stream().findFirst();
    }

    /** Movies matching ANY of the genres, best rated first. Empty list = all movies. */
    public List<Movie> recommend(List<String> genres) {
        if (genres == null || genres.isEmpty()) {
            return jdbc.query(BASE + " ORDER BY m.rating DESC", MAPPER);
        }
        return named.query(BASE + " WHERE m.id IN (SELECT movie_id FROM movie_genres WHERE genre IN (:genres))"
                        + " ORDER BY m.rating DESC, m.title",
                new MapSqlParameterSource("genres", genres), MAPPER);
    }

    public List<String> allGenres() {
        return jdbc.queryForList("SELECT DISTINCT genre FROM movie_genres ORDER BY genre", String.class);
    }

    public long create(MovieRequest r) {
        long id = JdbcUtil.insert(jdbc,
                "INSERT INTO movies (title, description, duration_minutes, language, rating, poster_url, "
              + "backdrop_url, release_date, now_showing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                r.title(), r.description(), r.durationMinutes() == null ? 120 : r.durationMinutes(),
                r.language() == null ? "English" : r.language(), r.rating() == null ? 0 : r.rating(),
                r.posterUrl(), r.backdropUrl(), r.releaseDate(), r.nowShowing() == null || r.nowShowing());
        replaceGenres(id, r.genres());
        return id;
    }

    public boolean update(long id, MovieRequest r) {
        int rows = jdbc.update(
                "UPDATE movies SET title=?, description=?, duration_minutes=?, language=?, rating=?, "
              + "poster_url=?, backdrop_url=?, release_date=?, now_showing=? WHERE id=?",
                r.title(), r.description(), r.durationMinutes() == null ? 120 : r.durationMinutes(),
                r.language() == null ? "English" : r.language(), r.rating() == null ? 0 : r.rating(),
                r.posterUrl(), r.backdropUrl(), r.releaseDate(), r.nowShowing() == null || r.nowShowing(), id);
        if (rows > 0) replaceGenres(id, r.genres());
        return rows > 0;
    }

    public boolean delete(long id) {
        return jdbc.update("DELETE FROM movies WHERE id = ?", id) > 0;
    }

    public long count() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM movies", Long.class);
        return n == null ? 0 : n;
    }

    private void replaceGenres(long movieId, List<String> genres) {
        jdbc.update("DELETE FROM movie_genres WHERE movie_id = ?", movieId);
        if (genres == null || genres.isEmpty()) return;
        List<Object[]> batch = new ArrayList<>();
        for (String g : genres.stream().map(String::trim).filter(s -> !s.isEmpty()).distinct().toList()) {
            batch.add(new Object[]{movieId, g});
        }
        jdbc.batchUpdate("INSERT INTO movie_genres (movie_id, genre) VALUES (?, ?)", batch);
    }
}
