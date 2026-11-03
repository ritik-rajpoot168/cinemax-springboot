package com.cinemax.api;

import com.cinemax.repository.UserRepository;
import com.cinemax.security.JwtUtil;
import com.cinemax.util.JdbcUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MernCompatibilityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtil jwt;

    @Test
    void originalReactApiContractWorksAcrossDiscoveryProfileAndBooking() throws Exception {
        String suffix=Long.toString(System.nanoTime());
        JsonNode auth=json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test User\",\"email\":\"tester"+suffix+"@example.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String token=auth.get("token").asText();long userId=auth.get("user").get("id").asLong();String bearer="Bearer "+token;

        long theatreId=insertTheatre("Cinemax Test", "Noida");
        long movieId=insertMovie("Compatibility Film", List.of("Action","Drama"),"now_showing",true);
        long showId=insertShow(movieId,theatreId);

        JsonNode listing=json.readTree(mvc.perform(get("/api/movies?search=compatibility&genre=Action&language=English&status=now_showing&page=1&limit=6&sort=rating"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals(1,listing.get("total").asInt());
        assertEquals("Compatibility Film",listing.get("movies").get(0).get("title").asText());
        assertTrue(listing.get("movies").get(0).has("_id"));
        mvc.perform(get("/api/movies/featured")).andExpect(status().isOk()).andExpect(jsonPath("$[0].featured").value(true));
        mvc.perform(get("/api/movies/"+movieId)).andExpect(status().isOk()).andExpect(jsonPath("$.showTimes[0]._id").value(String.valueOf(showId)))
                .andExpect(jsonPath("$.showTimes[0].bookedSeats").isArray()).andExpect(jsonPath("$.genre[0]").value("Action"));
        mvc.perform(get("/api/theatres?city=noida&limit=20")).andExpect(status().isOk()).andExpect(jsonPath("$[0]._id").value(String.valueOf(theatreId)));
        mvc.perform(get("/api/booking/seats/"+movieId+"/"+showId)).andExpect(status().isOk()).andExpect(jsonPath("$.totalSeats").value(80)).andExpect(jsonPath("$.bookedSeats").isEmpty());
        mvc.perform(get("/api/recommendations?genres=Action&limit=5")).andExpect(status().isOk()).andExpect(jsonPath("$.source").value("genre_based")).andExpect(jsonPath("$.movies[0].title").value("Compatibility Film"));
        mvc.perform(get("/api/recommendations/genres")).andExpect(status().isOk()).andExpect(jsonPath("$[0]").value("Action"));

        mvc.perform(get("/api/movies/recommendations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/movies/recommendations").header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$[0].title").value("Compatibility Film"));
        mvc.perform(post("/api/movies/favorite/"+movieId).header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$.isFavorite").value(true));
        mvc.perform(get("/api/auth/profile").header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$.favorites[0]._id").value(String.valueOf(movieId)));
        mvc.perform(put("/api/auth/profile").header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Updated User\",\"preferences\":{\"genres\":[\"Action\"],\"languages\":[\"Hindi\"]}}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated User")).andExpect(jsonPath("$.preferences.genres[0]").value("Action"));
        mvc.perform(post("/api/movies/review/"+movieId).header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":9,\"comment\":\"Great film\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.message").value("Review added"));
        mvc.perform(post("/api/movies/review/"+movieId).header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":8,\"comment\":\"Duplicate\"}")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/movies/"+movieId)).andExpect(status().isOk()).andExpect(jsonPath("$.reviews[0].user.name").value("Updated User"));

        // Client-supplied amount is ignored; the server derives the total from the stored showtime.
        JsonNode intent=json.readTree(mvc.perform(post("/api/payment/create-payment-intent").header("Authorization",bearer)
                .contentType(MediaType.APPLICATION_JSON).content("{\"amount\":1,\"bookingData\":{\"movieId\":\""+movieId+"\",\"showTimeId\":\""+showId+"\",\"seats\":[\"A1\"]}}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(300.0)).andReturn().getResponse().getContentAsString());
        String pi=intent.get("paymentIntentId").asText();
        String confirm="{\"paymentIntentId\":\""+pi+"\",\"bookingData\":{\"movieId\":\""+movieId+"\",\"showTimeId\":\""+showId+"\",\"seats\":[\"A1\"],\"theatreId\":\""+theatreId+"\",\"theatreName\":\"Cinemax Test\",\"theatreAddress\":\"Test Road\",\"city\":\"Noida\"}}";
        JsonNode confirmed=json.readTree(mvc.perform(post("/api/payment/confirm").header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON).content(confirm))
                .andExpect(status().isOk()).andExpect(jsonPath("$.booking.bookingStatus").value("confirmed")).andExpect(jsonPath("$.booking.paymentStatus").value("paid"))
                .andExpect(jsonPath("$.booking.seats[0]").value("A1")).andReturn().getResponse().getContentAsString());
        String bookingId=confirmed.get("booking").get("_id").asText();
        mvc.perform(get("/api/booking/my-bookings").header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$[0].bookingCode").isNotEmpty());
        mvc.perform(get("/api/booking/"+bookingId).header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$.movie.posterUrl").isNotEmpty());
        JsonNode other=json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Other User\",\"email\":\"other"+suffix+"@example.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        mvc.perform(get("/api/booking/"+bookingId).header("Authorization","Bearer "+other.get("token").asText())).andExpect(status().isNotFound());
        mvc.perform(get("/api/booking/seats/"+movieId+"/"+showId)).andExpect(status().isOk()).andExpect(jsonPath("$.bookedSeats[0]").value("A1"));
        mvc.perform(post("/api/payment/create-payment-intent").header("Authorization",bearer).contentType(MediaType.APPLICATION_JSON)
                .content("{\"bookingData\":{\"movieId\":\""+movieId+"\",\"showTimeId\":\""+showId+"\",\"seats\":[\"A1\"]}}"))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/booking/cancel/"+bookingId).header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$.message").value("Booking cancelled and seats released"));
        mvc.perform(get("/api/booking/seats/"+movieId+"/"+showId)).andExpect(status().isOk()).andExpect(jsonPath("$.bookedSeats").isEmpty());
        mvc.perform(get("/api/admin/stats").header("Authorization",bearer)).andExpect(status().isForbidden());

        long admin=users.save("Admin Test","admin"+suffix+"@example.com",encoder.encode("secret123"),"ADMIN");
        String adminToken="Bearer "+jwt.generate(admin,"admin"+suffix+"@example.com","ADMIN");
        mvc.perform(get("/api/admin/stats").header("Authorization",adminToken)).andExpect(status().isOk())
                .andExpect(jsonPath("$.stats.totalMovies").value(1)).andExpect(jsonPath("$.stats.totalUsers").value(3))
                .andExpect(jsonPath("$.stats.totalSeats").value(0)).andExpect(jsonPath("$.monthlyData").isArray());
        mvc.perform(get("/api/admin/users").header("Authorization",adminToken)).andExpect(status().isOk()).andExpect(jsonPath("$[0].role").exists());
    }

    private long insertTheatre(String name,String city){return JdbcUtil.insert(jdbc,"INSERT INTO theatres(name,address,city,state,pincode,latitude,longitude,amenities_json,screens,rating) VALUES (?,?,?,?,?,?,?,?,?,?)",name,"Test Road",city,"UP","201301",28.5355,77.3910,"[\"Parking\",\"Food Court\"]",4,4.4);}
    private long insertMovie(String title,List<String> genres,String status,boolean featured){long id=JdbcUtil.insert(jdbc,"INSERT INTO movies(title,description,duration_minutes,language,rating,poster_url,release_date,status,featured,age_rating) VALUES (?,?,?,?,?,?,?,?,?,?)",title,"A test movie description",120,"English,Hindi",8.0,"https://example.test/poster.jpg",LocalDate.now(),status,featured,"UA");for(String g:genres)jdbc.update("INSERT INTO movie_genres(movie_id,genre) VALUES (?,?)",id,g);return id;}
    private long insertShow(long movie,long theatre){long id=JdbcUtil.insert(jdbc,"INSERT INTO show_times(movie_id,theatre_id,screen,show_time,format,start_time,price,total_seats) VALUES (?,?,?,?,?,?,?,?)",movie,theatre,"Screen 1","6:30 PM","2D",Timestamp.valueOf(LocalDateTime.now().plusDays(1)),new BigDecimal("250.00"),80);List<Object[]> seats=new ArrayList<>();for(char row='A';row<='H';row++)for(int n=1;n<=10;n++)seats.add(new Object[]{id,String.valueOf(row),n});jdbc.batchUpdate("INSERT INTO seats(show_time_id,row_label,seat_number) VALUES (?,?,?)",seats);return id;}
}
