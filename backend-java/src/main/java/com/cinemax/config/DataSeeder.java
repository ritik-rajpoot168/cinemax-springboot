package com.cinemax.config;

import com.cinemax.dto.MovieRequest;
import com.cinemax.repository.MovieRepository;
import com.cinemax.repository.ShowTimeRepository;
import com.cinemax.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/** Replaces "npm run seed": inserts demo accounts, movies and shows on first start (only if tables are empty). */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final MovieRepository movies;
    private final ShowTimeRepository showTimes;
    private final PasswordEncoder encoder;
    private final boolean enabled;

    public DataSeeder(UserRepository users, MovieRepository movies, ShowTimeRepository showTimes,
                      PasswordEncoder encoder, @Value("${app.seed:true}") boolean enabled) {
        this.users = users;
        this.movies = movies;
        this.showTimes = showTimes;
        this.encoder = encoder;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        if (users.count() == 0) {
            users.save("Admin", "admin@cinema.com", encoder.encode("admin123"), "ADMIN");
            users.save("Demo User", "user@cinema.com", encoder.encode("user123"), "USER");
        }
        if (movies.count() == 0) {
            seedMovie("Orbit Zero", "A crew races to repair a failing station before it falls out of orbit.", 128, "English", 8.4,
                    List.of("Sci-Fi", "Action"));
            seedMovie("The Last Lighthouse", "A keeper uncovers the secret behind a ship that never arrives.", 112, "English", 7.9,
                    List.of("Drama", "Mystery"));
            seedMovie("Laughing Matters", "Three old friends plan one final road trip and everything goes wrong.", 98, "English", 7.2,
                    List.of("Comedy"));
            seedMovie("Neon Streets", "A courier takes one job too many in a city that never sleeps.", 121, "English", 8.1,
                    List.of("Action", "Thriller"));
            seedMovie("Monsoon Letters", "Two strangers share letters across a rainy summer in Kerala.", 134, "Hindi", 8.6,
                    List.of("Romance", "Drama"));
            seedMovie("Haunted Hollow", "A family moves into a house with one rule: never open the cellar.", 104, "English", 6.8,
                    List.of("Horror", "Thriller"));
        }
    }

    private void seedMovie(String title, String desc, int minutes, String language, double rating, List<String> genres) {
        long id = movies.create(new MovieRequest(title, desc, minutes, language, rating, null, null,
                LocalDate.now().minusDays(20), true, genres));
        LocalDate today = LocalDate.now();
        for (int day = 0; day < 3; day++) {
            showTimes.create(id, "Screen 1", LocalDateTime.of(today.plusDays(day), LocalTime.of(18, 30)), new BigDecimal("250.00"));
            showTimes.create(id, "Screen 2", LocalDateTime.of(today.plusDays(day), LocalTime.of(21, 45)), new BigDecimal("300.00"));
        }
    }
}
