package com.cinemax.repository;

import com.cinemax.model.BookingView;
import com.cinemax.util.JdbcUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class BookingRepository {
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;

    private static final String BASE =
            "SELECT b.id, u.email, m.title, s.screen, s.start_time, b.total_amount, b.payment_status, b.created_at, "
          + "(SELECT GROUP_CONCAT(CONCAT(x.row_label, x.seat_number) ORDER BY x.row_label, x.seat_number SEPARATOR ',') "
          + "FROM seats x WHERE x.booking_id = b.id) AS seat_list "
          + "FROM bookings b JOIN users u ON u.id = b.user_id "
          + "JOIN show_times s ON s.id = b.show_time_id JOIN movies m ON m.id = s.movie_id";

    private static final RowMapper<BookingView> MAPPER = (rs, i) -> {
        String seats = rs.getString("seat_list");
        return new BookingView(rs.getLong("id"), rs.getString("email"), rs.getString("title"),
                rs.getString("screen"), rs.getTimestamp("start_time").toLocalDateTime(),
                seats == null ? List.of() : Arrays.asList(seats.split(",")),
                rs.getBigDecimal("total_amount"), rs.getString("payment_status"),
                rs.getTimestamp("created_at").toLocalDateTime());
    };

    public BookingRepository(JdbcTemplate jdbc, NamedParameterJdbcTemplate named) {
        this.jdbc = jdbc;
        this.named = named;
    }

    public long insert(long userId, long showTimeId, BigDecimal total, String paymentStatus, String paymentRef) {
        return JdbcUtil.insert(jdbc,
                "INSERT INTO bookings (user_id, show_time_id, total_amount, payment_status, payment_ref) "
              + "VALUES (?, ?, ?, ?, ?)", userId, showTimeId, total, paymentStatus, paymentRef);
    }

    /**
     * Atomically claims seats: only rows that are still AVAILABLE are updated.
     * The caller compares the returned row count with the number of requested seats.
     */
    public int reserveSeats(long bookingId, long showTimeId, List<String> labels) {
        return named.update("UPDATE seats SET status = 'BOOKED', booking_id = :bid "
                        + "WHERE show_time_id = :sid AND status = 'AVAILABLE' "
                        + "AND CONCAT(row_label, seat_number) IN (:labels)",
                new MapSqlParameterSource().addValue("bid", bookingId)
                        .addValue("sid", showTimeId).addValue("labels", labels));
    }

    public int countAvailable(long showTimeId, List<String> labels) {
        Integer n = named.queryForObject("SELECT COUNT(*) FROM seats WHERE show_time_id = :sid "
                        + "AND status = 'AVAILABLE' AND CONCAT(row_label, seat_number) IN (:labels)",
                new MapSqlParameterSource().addValue("sid", showTimeId).addValue("labels", labels),
                Integer.class);
        return n == null ? 0 : n;
    }

    public Optional<BookingView> findById(long id) {
        return jdbc.query(BASE + " WHERE b.id = ?", MAPPER, id).stream().findFirst();
    }

    public List<BookingView> findByUser(long userId) {
        return jdbc.query(BASE + " WHERE b.user_id = ? ORDER BY b.created_at DESC", MAPPER, userId);
    }

    public List<BookingView> findAll() {
        return jdbc.query(BASE + " ORDER BY b.created_at DESC", MAPPER);
    }

    public Map<String, Object> stats() {
        return jdbc.queryForMap("SELECT (SELECT COUNT(*) FROM movies) AS totalMovies, "
                + "(SELECT COUNT(*) FROM users) AS totalUsers, "
                + "(SELECT COUNT(*) FROM bookings) AS totalBookings, "
                + "(SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'PAID') AS revenue");
    }
}
