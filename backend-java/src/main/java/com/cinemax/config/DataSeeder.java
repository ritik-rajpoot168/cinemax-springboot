package com.cinemax.config;

import com.cinemax.dto.MovieRequest;
import com.cinemax.repository.MovieRepository;
import com.cinemax.repository.ShowTimeRepository;
import com.cinemax.repository.UserRepository;
import com.cinemax.util.JdbcUtil;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbc;
    private final boolean enabled;

    public DataSeeder(UserRepository users, MovieRepository movies, ShowTimeRepository showTimes,
                      PasswordEncoder encoder, JdbcTemplate jdbc, @Value("${app.seed:true}") boolean enabled) {
        this.users = users;
        this.movies = movies;
        this.showTimes = showTimes;
        this.encoder = encoder;
        this.jdbc = jdbc;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!enabled) return;
        seedTheatres();
        if (users.count() == 0) {
            users.save("Admin", "admin@cinema.com", encoder.encode("admin123"), "ADMIN");
            users.save("Demo User", "user@cinema.com", encoder.encode("user123"), "USER");
        }
        if (movies.count() == 0) {
            seedMovie("Orbit Zero", "A crew races to repair a failing station before it falls out of orbit.", 128, "English", 8.4, List.of("Sci-Fi", "Action"), "now_showing", true);
            seedMovie("The Last Lighthouse", "A keeper uncovers the secret behind a ship that never arrives.", 112, "English", 7.9, List.of("Drama", "Mystery"), "now_showing", true);
            seedMovie("Laughing Matters", "Three old friends plan one final road trip and everything goes wrong.", 98, "English", 7.2, List.of("Comedy"), "now_showing", false);
            seedMovie("Neon Streets", "A courier takes one job too many in a city that never sleeps.", 121, "English", 8.1, List.of("Action", "Thriller"), "now_showing", false);
            seedMovie("Monsoon Letters", "Two strangers share letters across a rainy summer in Kerala.", 134, "Hindi", 8.6, List.of("Romance", "Drama"), "coming_soon", false);
            seedMovie("Haunted Hollow", "A family moves into a house with one rule: never open the cellar.", 104, "English", 6.8, List.of("Horror", "Thriller"), "coming_soon", false);
        }
    }

    private void seedTheatres() {
        Integer count=jdbc.queryForObject("SELECT COUNT(*) FROM theatres",Integer.class);
        if(count!=null&&count>0)return;
        addTheatre("Cinemax Grand", "Sector 18, Noida", "Noida", "Uttar Pradesh", "201301", 28.5708, 77.3261, 6);
        addTheatre("Cinemax Central", "Connaught Place", "New Delhi", "Delhi", "110001", 28.6315, 77.2167, 5);
        addTheatre("Cinemax Horizon", "Knowledge Park", "Greater Noida", "Uttar Pradesh", "201310", 28.4744, 77.5030, 4);
    }

    private void addTheatre(String name,String address,String city,String state,String pin,double lat,double lng,int screens) {
        JdbcUtil.insert(jdbc,"INSERT INTO theatres(name,address,city,state,pincode,latitude,longitude,amenities_json,screens,rating,image,phone) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                name,address,city,state,pin,lat,lng,"[\"Parking\",\"Food Court\",\"Recliner\"]",screens,4.4,"","");
    }

    private void seedMovie(String title, String desc, int minutes, String language, double rating, List<String> genres, String status, boolean featured) {
        long id = movies.create(new MovieRequest(title, desc, minutes, language, rating, null, null,
                LocalDate.now().minusDays(20), true, genres));
        jdbc.update("UPDATE movies SET status=?,featured=? WHERE id=?",status,featured,id);
        LocalDate today = LocalDate.now();
        for (int day = 0; day < 3; day++) {
            long first=showTimes.create(id, "Screen 1", LocalDateTime.of(today.plusDays(day), LocalTime.of(18, 30)), new BigDecimal("250.00"));
            long second=showTimes.create(id, "Screen 2", LocalDateTime.of(today.plusDays(day), LocalTime.of(21, 45)), new BigDecimal("300.00"));
            Long theatre=jdbc.queryForObject("SELECT MIN(id) FROM theatres",Long.class);
            jdbc.update("UPDATE show_times SET theatre_id=? WHERE id IN (?,?)",theatre,first,second);
        }
    }
}
