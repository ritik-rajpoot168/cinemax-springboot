package com.cinemax.repository;

import com.cinemax.model.User;
import com.cinemax.util.JdbcUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbc;

    private static final RowMapper<User> MAPPER = (rs, i) -> new User(
            rs.getLong("id"), rs.getString("name"), rs.getString("email"),
            rs.getString("password_hash"), rs.getString("role"));

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> findByEmail(String email) {
        return jdbc.query("SELECT * FROM users WHERE email = ?", MAPPER, email).stream().findFirst();
    }

    public Optional<User> findById(long id) {
        return jdbc.query("SELECT * FROM users WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public long save(String name, String email, String passwordHash, String role) {
        return JdbcUtil.insert(jdbc,
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                name, email, passwordHash, role);
    }

    public long count() {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        return n == null ? 0 : n;
    }
}
