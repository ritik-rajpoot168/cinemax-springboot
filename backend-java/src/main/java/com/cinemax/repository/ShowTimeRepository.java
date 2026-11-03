package com.cinemax.repository;

import com.cinemax.model.Seat;
import com.cinemax.model.ShowTime;
import com.cinemax.util.JdbcUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ShowTimeRepository {
    public static final String ROWS = "ABCDEFGH";   // 8 rows
    public static final int SEATS_PER_ROW = 10;     // x 10 seats = 80 seats per show

    private final JdbcTemplate jdbc;

    private static final String BASE =
            "SELECT s.*, (SELECT COUNT(*) FROM seats x WHERE x.show_time_id = s.id AND x.status = 'AVAILABLE') "
          + "AS available FROM show_times s";

    private static final RowMapper<ShowTime> MAPPER = (rs, i) -> new ShowTime(
            rs.getLong("id"), rs.getLong("movie_id"), rs.getString("screen"),
            rs.getTimestamp("start_time").toLocalDateTime(), rs.getBigDecimal("price"), rs.getInt("available"));

    public ShowTimeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ShowTime> findUpcomingByMovie(long movieId) {
        return jdbc.query(BASE + " WHERE s.movie_id = ? AND s.start_time > NOW() ORDER BY s.start_time",
                MAPPER, movieId);
    }

    public Optional<ShowTime> findById(long id) {
        return jdbc.query(BASE + " WHERE s.id = ?", MAPPER, id).stream().findFirst();
    }

    public List<Seat> findSeats(long showTimeId) {
        return jdbc.query("SELECT CONCAT(row_label, seat_number) AS label, status FROM seats "
                        + "WHERE show_time_id = ? ORDER BY row_label, seat_number",
                (rs, i) -> new Seat(rs.getString("label"), rs.getString("status")), showTimeId);
    }

    /** Creates the show and its 80 seats. Call from a @Transactional service method. */
    public long create(long movieId, String screen, LocalDateTime start, BigDecimal price) {
        long id = JdbcUtil.insert(jdbc,
                "INSERT INTO show_times (movie_id, screen, start_time, price) VALUES (?, ?, ?, ?)",
                movieId, screen, start, price);
        List<Object[]> seats = new ArrayList<>();
        for (char row : ROWS.toCharArray()) {
            for (int n = 1; n <= SEATS_PER_ROW; n++) {
                seats.add(new Object[]{id, String.valueOf(row), n});
            }
        }
        jdbc.batchUpdate("INSERT INTO seats (show_time_id, row_label, seat_number) VALUES (?, ?, ?)", seats);
        return id;
    }
}
