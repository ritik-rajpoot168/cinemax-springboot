package com.cinemax.util;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import java.sql.PreparedStatement;
import java.sql.Statement;

public final class JdbcUtil {
    private JdbcUtil() {}

    /** Runs an INSERT and returns the auto-generated primary key. */
    public static long insert(JdbcTemplate jdbc, String sql, Object... args) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) {
                ps.setObject(i + 1, args[i]);
            }
            return ps;
        }, keyHolder);
        Object key = keyHolder.getKeyList().stream().findFirst()
                .map(row -> row.entrySet().stream()
                        .filter(entry -> "id".equalsIgnoreCase(String.valueOf(entry.getKey())))
                        .map(java.util.Map.Entry::getValue).findFirst().orElse(null))
                .orElse(null);
        if (key == null) key = keyHolder.getKey();
        if (!(key instanceof Number number)) throw new IllegalStateException("Insert did not return a numeric id");
        return number.longValue();
    }
}
