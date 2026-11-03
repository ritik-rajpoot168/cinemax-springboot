package com.cinemax.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cinemax.exception.ApiException;
import com.cinemax.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Compatibility layer for the original MERN Cinemax API. It deliberately emits the
 * same response keys (including Mongo-style _id aliases) so the React app can stay unchanged.
 */
@Service
public class MernCompatibilityService {
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.US);
    private final JdbcTemplate jdbc;
    private final NamedParameterJdbcTemplate named;
    private final ObjectMapper json;
    private final PaymentService payments;

    public MernCompatibilityService(JdbcTemplate jdbc, NamedParameterJdbcTemplate named,
                                    ObjectMapper json, PaymentService payments) {
        this.jdbc = jdbc;
        this.named = named;
        this.json = json;
        this.payments = payments;
    }

    public Map<String,Object> movie(long id, boolean full) {
        Map<String,Object> m = named.queryForList("SELECT * FROM movies WHERE id=:id", Map.of("id", id))
                .stream().findFirst().map(r -> movieBase(r, full)).orElse(null);
        if (m == null) throw notFound("Movie not found");
        if (full) {
            m.put("reviews", jdbc.query("SELECT r.*, u.avatar FROM movie_reviews r LEFT JOIN users u ON u.id=r.user_id WHERE r.movie_id=? ORDER BY r.created_at DESC",
                    (rs,n) -> review(rs), id));
            m.put("showTimes", jdbc.query("SELECT s.*, (SELECT COUNT(*) FROM seats x WHERE x.show_time_id=s.id AND x.status='BOOKED') booked_count FROM show_times s WHERE s.movie_id=? ORDER BY s.start_time",
                    (rs,n) -> showTime(rs), id));
        }
        return m;
    }

    public Map<String,Object> movies(Map<String,String> q) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        MapSqlParameterSource p = new MapSqlParameterSource();
        String search = q.get("search");
        if (search != null && !search.isBlank()) { where.append(" AND LOWER(m.title) LIKE :search"); p.addValue("search", "%"+search.toLowerCase(Locale.ROOT)+"%"); }
        List<String> genres = csv(q.get("genre"));
        if (!genres.isEmpty()) { where.append(" AND EXISTS (SELECT 1 FROM movie_genres g WHERE g.movie_id=m.id AND g.genre IN (:genres))"); p.addValue("genres", genres); }
        List<String> languages = csv(q.get("language"));
        if (!languages.isEmpty()) {
            List<String> likes = new ArrayList<>();
            for (int i=0;i<languages.size();i++) { String k="lang"+i; likes.add("LOWER(m.language) LIKE :"+k); p.addValue(k,"%"+languages.get(i).toLowerCase(Locale.ROOT)+"%"); }
            where.append(" AND (").append(String.join(" OR ",likes)).append(')');
        }
        if (q.get("status") != null && !q.get("status").isBlank()) { where.append(" AND m.status=:status"); p.addValue("status",q.get("status")); }
        String sort = switch (Objects.toString(q.get("sort"), "")) { case "rating" -> "m.rating DESC, m.title"; case "newest" -> "m.release_date DESC"; case "oldest" -> "m.release_date ASC"; default -> "m.created_at DESC"; };
        int page = boundedInt(q.get("page"),1,1,1_000_000), limit=boundedInt(q.get("limit"),12,1,100);
        Long total = named.queryForObject("SELECT COUNT(*) FROM movies m"+where,p,Long.class);
        p.addValue("limit",limit).addValue("offset",(page-1)*limit);
        List<Map<String,Object>> list = named.query("SELECT m.* FROM movies m"+where+" ORDER BY "+sort+" LIMIT :limit OFFSET :offset",p,(rs,n)->movieBase(rs,false));
        Map<String,Object> result = new LinkedHashMap<>(); result.put("movies",list); result.put("total",total==null?0:total); result.put("page",page); result.put("pages",(int)Math.ceil((total==null?0:total)/(double)limit)); return result;
    }

    public List<Map<String,Object>> featured() { return jdbc.query("SELECT * FROM movies WHERE featured=TRUE AND status='now_showing' ORDER BY rating DESC LIMIT 5",(rs,n)->movieBase(rs,false)); }
    public List<String> genres() { return jdbc.queryForList("SELECT DISTINCT genre FROM movie_genres ORDER BY genre",String.class); }

    public Map<String,Object> globalRecommendations(String genreCsv,String excludeCsv,String limitRaw) {
        List<String> gs=csv(genreCsv), ex=csv(excludeCsv); int limit=boundedInt(limitRaw,10,1,50);
        String sql="SELECT m.* FROM movies m WHERE m.status='now_showing'";
        MapSqlParameterSource p=new MapSqlParameterSource().addValue("lim",limit);
        if(!ex.isEmpty()){ sql+=" AND CAST(m.id AS CHAR) NOT IN (:ex)"; p.addValue("ex",ex); }
        String source="top_rated";
        if(!gs.isEmpty()){ sql+=" AND EXISTS (SELECT 1 FROM movie_genres g WHERE g.movie_id=m.id AND g.genre IN (:genres))"; p.addValue("genres",gs); source="genre_based"; }
        sql+=" ORDER BY m.rating DESC,m.critics_rating DESC,m.imdb_rating DESC,m.title LIMIT :lim";
        List<Map<String,Object>> list=named.query(sql,p,(rs,n)->movieBase(rs,false));
        Map<String,Object> out=new LinkedHashMap<>();out.put("movies",list);out.put("source",source);return out;
    }

    public List<Map<String,Object>> personalizedRecommendations(long userId) {
        List<String> prefs=jdbc.queryForList("SELECT pref_value FROM user_preferences WHERE user_id=? AND preference_type='genre'",String.class,userId);
        List<Long> watched=jdbc.queryForList("SELECT movie_id FROM user_watch_history WHERE user_id=?",Long.class,userId);
        String sql="SELECT DISTINCT m.* FROM movies m WHERE m.status='now_showing'";
        MapSqlParameterSource p=new MapSqlParameterSource().addValue("user",userId);
        if(!watched.isEmpty()){sql+=" AND m.id NOT IN (:watched)";p.addValue("watched",watched);}
        if(!prefs.isEmpty()){sql+=" AND EXISTS (SELECT 1 FROM movie_genres g WHERE g.movie_id=m.id AND g.genre IN (:genres))";p.addValue("genres",prefs);}
        sql+=" ORDER BY m.rating DESC LIMIT 10";
        if(prefs.isEmpty()) { sql="SELECT m.* FROM movies m WHERE m.status='now_showing' ORDER BY m.rating DESC LIMIT 10"; p=new MapSqlParameterSource(); }
        return named.query(sql,p,(rs,n)->movieBase(rs,false));
    }

    public List<Map<String,Object>> theatres(String city,String latRaw,String lngRaw,String limitRaw) {
        int limit=boundedInt(limitRaw,20,1,100); String sql="SELECT * FROM theatres WHERE is_active=TRUE"; List<Object> args=new ArrayList<>();
        if(city!=null&&!city.isBlank()){sql+=" AND LOWER(city) LIKE ?";args.add("%"+city.toLowerCase(Locale.ROOT)+"%");}
        sql+=" LIMIT ?";args.add(limit);
        List<Map<String,Object>> out=jdbc.query(sql,(rs,n)->theatre(rs),args.toArray());
        if(latRaw!=null&&lngRaw!=null) {
            double lat=parseDouble(latRaw,Double.NaN),lng=parseDouble(lngRaw,Double.NaN);
            if(!Double.isFinite(lat)||!Double.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180) throw bad("Invalid coordinates");
            out.forEach(t->t.put("distance",Math.round(distance(lat,lng,(double)t.get("lat"),(double)t.get("lng"))*10.0)/10.0));
            out.sort(Comparator.comparingDouble(t->(double)t.get("distance")));
        }
        return out;
    }
    public Map<String,Object> theatre(long id){return jdbc.query("SELECT * FROM theatres WHERE id=?",(rs,n)->theatre(rs),id).stream().findFirst().orElseThrow(()->notFound("Theatre not found"));}

    public Map<String,Object> profile(long userId) { return user(userId,true); }
    @Transactional public Map<String,Object> updateProfile(long userId,Map<String,Object> body) {
        String name=Objects.toString(body.get("name"),"").trim(); if(name.isBlank()||name.length()>100)throw bad("Name is required");
        jdbc.update("UPDATE users SET name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",name,userId);
        Object prefObj=body.get("preferences");
        if(prefObj instanceof Map<?,?> prefs) {
            replacePreferences(userId,"genre",stringList(prefs.get("genres")));
            replacePreferences(userId,"language",stringList(prefs.get("languages")));
        }
        return profile(userId);
    }
    @Transactional public Map<String,Object> toggleFavorite(long userId,long movieId) {
        movie(movieId,false);
        int existing=jdbc.update("DELETE FROM user_favorites WHERE user_id=? AND movie_id=?",userId,movieId);
        boolean now=existing==0;
        if(now)jdbc.update("INSERT INTO user_favorites(user_id,movie_id) VALUES (?,?)",userId,movieId);
        Map<String,Object> out=new LinkedHashMap<>();out.put("favorites",jdbc.queryForList("SELECT CAST(movie_id AS CHAR) FROM user_favorites WHERE user_id=? ORDER BY movie_id",String.class,userId));out.put("isFavorite",now);return out;
    }
    @Transactional public Map<String,Object> review(long userId,long movieId,Map<String,Object> body) {
        int rating=boundedInt(Objects.toString(body.get("rating"),null),0,0,10);String comment=Objects.toString(body.get("comment"),"").trim();
        if(rating<1||rating>10||comment.isBlank())throw bad("Rating and comment required");
        Map<String,Object> u=user(userId,false);movie(movieId,false);
        Integer exists=jdbc.queryForObject("SELECT COUNT(*) FROM movie_reviews WHERE movie_id=? AND user_id=?",Integer.class,movieId,userId);
        if(exists!=null&&exists>0)throw bad("You already reviewed this movie");
        jdbc.update("INSERT INTO movie_reviews(movie_id,user_id,user_name,rating,comment) VALUES (?,?,?,?,?)",movieId,userId,u.get("name"),rating,comment);
        jdbc.update("UPDATE movies SET total_ratings=(SELECT COUNT(*) FROM movie_reviews WHERE movie_id=?),rating=(SELECT COALESCE(AVG(rating),0) FROM movie_reviews WHERE movie_id=?) WHERE id=?",movieId,movieId,movieId);
        jdbc.update("INSERT INTO user_watch_history(user_id,movie_id) VALUES (?,?) ON DUPLICATE KEY UPDATE watched_at=CURRENT_TIMESTAMP",userId,movieId);
        Map<String,Object> out=new LinkedHashMap<>();out.put("message","Review added");out.put("rating",jdbc.queryForObject("SELECT rating FROM movies WHERE id=?",BigDecimal.class,movieId));return out;
    }

    public List<Map<String,Object>> allUsers(){return jdbc.query("SELECT id FROM users ORDER BY created_at DESC",(rs,n)->rs.getLong(1)).stream().map(id->user(id,true)).toList();}
    @Transactional public Map<String,Object> updateRole(long id,String role){String normalized=Objects.toString(role,"").trim().toUpperCase(Locale.ROOT);if(!Set.of("USER","ADMIN").contains(normalized))throw bad("Role must be user or admin");int n=jdbc.update("UPDATE users SET role=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",normalized,id);if(n==0)throw notFound("User not found");return user(id,false);}

    @Transactional public Map<String,Object> createPayment(long userId,Map<String,Object> req) {
        Map<?,?> bd=objectMap(req.get("bookingData"));long showId=number(bd.get("showTimeId"),"showTimeId");List<String> seats=cleanSeats(bd.get("seats"));
        Map<String,Object> st=showTimeById(showId);long movieId=number(st.get("movieId"),"movieId");
        if(bd.get("movieId")!=null&&number(bd.get("movieId"),"movieId")!=movieId)throw bad("Showtime does not belong to movie");
        ensureAvailable(showId,seats);
        BigDecimal ticketTotal=((BigDecimal)st.get("price")).multiply(BigDecimal.valueOf(seats.size()));
        BigDecimal total=ticketTotal.multiply(new BigDecimal("1.10")).add(BigDecimal.valueOf(25L*seats.size())).setScale(2,java.math.RoundingMode.HALF_UP);
        PaymentService.Intent intent=payments.createIntent(total);
        Long theatreId=optionalLong(bd.get("theatreId"));
        jdbc.update("INSERT INTO payment_intents(intent_id,user_id,show_time_id,seats_json,total_amount,theatre_id) VALUES (?,?,?,?,?,?)",intent.id(),userId,showId,writeJson(seats),total,theatreId);
        Map<String,Object> out=new LinkedHashMap<>();out.put("clientSecret",intent.clientSecret());out.put("paymentIntentId",intent.id());out.put("amount",total);out.put("mock",intent.mock());return out;
    }
    @Transactional public Map<String,Object> confirmPayment(long userId,Map<String,Object> req) {
        String intent=Objects.toString(req.get("paymentIntentId"),""); if(intent.isBlank())throw bad("Payment intent is required");
        Map<String,Object> pi=named.query("SELECT * FROM payment_intents WHERE intent_id=:id AND user_id=:uid FOR UPDATE",new MapSqlParameterSource().addValue("id",intent).addValue("uid",userId),(rs,n)->{
            Map<String,Object> row=new HashMap<>();row.put("showTimeId",rs.getLong("show_time_id"));row.put("seats",readJson(rs.getString("seats_json")));row.put("amount",rs.getBigDecimal("total_amount"));row.put("theatreId",(Long)rs.getObject("theatre_id"));row.put("consumed",rs.getBoolean("consumed"));return row;
        }).stream().findFirst().orElseThrow(()->bad("Payment intent not found for this account"));
        if(Boolean.TRUE.equals(pi.get("consumed")))throw bad("Payment intent was already used");
        if(!payments.isPaid(intent))throw new ApiException(HttpStatus.BAD_REQUEST,"Payment not completed");
        Map<?,?> bd=objectMap(req.get("bookingData"));long showId=(long)pi.get("showTimeId");List<String> seats=(List<String>)pi.get("seats");
        if(number(bd.get("showTimeId"),"showTimeId")!=showId||!new HashSet<>(cleanSeats(bd.get("seats"))).equals(new HashSet<>(seats)))throw bad("Booking details do not match payment");
        Map<String,Object> st=showTimeById(showId);long movieId=number(st.get("movieId"),"movieId");if(bd.get("movieId")!=null&&number(bd.get("movieId"),"movieId")!=movieId)throw bad("Showtime does not belong to movie");
        Map<String,Object> theatre=chooseTheatre(bd.get("theatreId"),pi.get("theatreId"));
        ensureAvailable(showId,seats);
        long bookingId=insertBooking(userId,movieId,showId,st,theatre,seats,(BigDecimal)pi.get("amount"),intent);
        int claimed=reserveSeats(bookingId,showId,seats);if(claimed!=seats.size())throw new ApiException(HttpStatus.CONFLICT,"One or more selected seats were just booked");
        jdbc.update("UPDATE payment_intents SET consumed=TRUE WHERE intent_id=?",intent);
        Map<String,Object> out=new LinkedHashMap<>();out.put("booking",booking(bookingId,null));out.put("message","Booking confirmed!");return out;
    }

    public Map<String,Object> booking(long bookingId,Long ownerId){
        MapSqlParameterSource p=new MapSqlParameterSource("id",bookingId);String sql="SELECT b.*,u.name user_name,u.email user_email,m.poster_url,m.title movie_name FROM bookings b JOIN users u ON u.id=b.user_id JOIN movies m ON m.id=b.movie_id WHERE b.id=:id";
        if(ownerId!=null){sql+=" AND b.user_id=:owner";p.addValue("owner",ownerId);}
        return named.query(sql,p,(rs,n)->bookingMap(rs,true)).stream().findFirst().orElseThrow(()->notFound("Booking not found"));
    }
    public List<Map<String,Object>> userBookings(long userId){return jdbc.query("SELECT b.*,u.name user_name,u.email user_email,m.poster_url,m.title movie_name FROM bookings b JOIN users u ON u.id=b.user_id JOIN movies m ON m.id=b.movie_id WHERE b.user_id=? ORDER BY b.created_at DESC",(rs,n)->bookingMap(rs,true),userId);}
    public List<Map<String,Object>> adminBookings(){return jdbc.query("SELECT b.*,u.name user_name,u.email user_email,m.poster_url,m.title movie_name FROM bookings b JOIN users u ON u.id=b.user_id JOIN movies m ON m.id=b.movie_id ORDER BY b.created_at DESC",(rs,n)->bookingMap(rs,true),new Object[0]);}
    @Transactional public Map<String,Object> cancelBooking(long userId,long id){Map<String,Object> b=booking(id,userId);if("cancelled".equals(b.get("bookingStatus")))throw bad("Already cancelled");jdbc.update("UPDATE seats SET status='AVAILABLE',booking_id=NULL WHERE booking_id=?",id);jdbc.update("UPDATE bookings SET booking_status='cancelled',payment_status='refunded',updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?",id,userId);Map<String,Object> out=new LinkedHashMap<>();out.put("message","Booking cancelled and seats released");return out;}
    @Transactional public void paymentFailed(String intentId){List<Long> ids=jdbc.queryForList("SELECT id FROM bookings WHERE payment_intent_id=? AND booking_status<>'cancelled'",Long.class,intentId);for(Long id:ids)jdbc.update("UPDATE seats SET status='AVAILABLE',booking_id=NULL WHERE booking_id=?",id);jdbc.update("UPDATE bookings SET booking_status='cancelled',payment_status='failed',updated_at=CURRENT_TIMESTAMP WHERE payment_intent_id=?",intentId);}
    public Map<String,Object> bookedSeats(long movieId,long showId){Map<String,Object> st=showTimeById(showId);if(number(st.get("movieId"),"movieId")!=movieId)throw notFound("Showtime not found");List<String> booked=jdbc.queryForList("SELECT CONCAT(row_label,seat_number) FROM seats WHERE show_time_id=? AND status='BOOKED' ORDER BY row_label,seat_number",String.class,showId);Map<String,Object> out=new LinkedHashMap<>();out.put("bookedSeats",booked);out.put("totalSeats",st.get("totalSeats"));return out;}

    public Map<String,Object> stats(){
        Map<String,Object> raw=jdbc.queryForMap("SELECT (SELECT COUNT(*) FROM movies) totalMovies,(SELECT COUNT(*) FROM users) totalUsers,(SELECT COUNT(*) FROM bookings WHERE payment_status='paid') totalBookings,(SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE payment_status='paid') totalRevenue,(SELECT COUNT(*) FROM seats WHERE booking_id IN (SELECT id FROM bookings WHERE payment_status='paid')) totalSeats");
        Map<String,Object> s=new LinkedHashMap<>();for(String key:List.of("totalMovies","totalUsers","totalBookings","totalRevenue","totalSeats"))s.put(key,raw.entrySet().stream().filter(e->e.getKey().equalsIgnoreCase(key)).map(Map.Entry::getValue).findFirst().orElse(0));
        List<Map<String,Object>> monthly=jdbc.query("SELECT YEAR(created_at) yr,MONTH(created_at) mo,SUM(total_amount) revenue,COUNT(*) bookings FROM bookings WHERE payment_status='paid' AND created_at>=? GROUP BY YEAR(created_at),MONTH(created_at) ORDER BY YEAR(created_at),MONTH(created_at)",(rs,n)->{Map<String,Object> x=new LinkedHashMap<>();x.put("_id",Map.of("year",rs.getInt("yr"),"month",rs.getInt("mo")));x.put("revenue",rs.getBigDecimal("revenue"));x.put("bookings",rs.getLong("bookings"));return x;},java.sql.Timestamp.valueOf(LocalDateTime.now().minusMonths(6)));
        List<Map<String,Object>> top=jdbc.query("SELECT movie_id,SUM(total_amount) revenue,COUNT(*) count,MAX(movie_title) title FROM bookings WHERE payment_status='paid' GROUP BY movie_id ORDER BY count DESC LIMIT 5",(rs,n)->{Map<String,Object>x=new LinkedHashMap<>();x.put("_id",String.valueOf(rs.getLong("movie_id")));x.put("title",rs.getString("title"));x.put("count",rs.getLong("count"));x.put("revenue",rs.getBigDecimal("revenue"));return x;});
        List<Map<String,Object>> recent=jdbc.query("SELECT b.*,u.name user_name,u.email user_email,m.poster_url,m.title movie_name FROM bookings b JOIN users u ON u.id=b.user_id JOIN movies m ON m.id=b.movie_id ORDER BY b.created_at DESC LIMIT 10",(rs,n)->bookingMap(rs,true),new Object[0]);
        Map<String,Object> out=new LinkedHashMap<>();out.put("stats",s);out.put("monthlyData",monthly);out.put("topMovies",top);out.put("recentBookings",recent);return out;
    }

    @Transactional public Map<String,Object> createMovie(Map<String,Object> b){long id=saveMovie(null,b);return movie(id,true);}
    @Transactional public Map<String,Object> updateMovie(long id,Map<String,Object>b){movie(id,false);saveMovie(id,b);return movie(id,true);}
    @Transactional public Map<String,Object> deleteMovie(long id){movie(id,false);jdbc.update("DELETE FROM movies WHERE id=?",id);Map<String,Object>r=new LinkedHashMap<>();r.put("message","Movie deleted");return r;}
    @Transactional public Map<String,Object> createShowTime(Map<String,Object>b){long movieId=number(b.get("movieId"),"movieId");movie(movieId,false);return addShowTime(movieId,b);}

    private long saveMovie(Long id,Map<String,Object>b){
        String title=Objects.toString(b.get("title"),"").trim(),description=Objects.toString(b.get("description"),"");if(title.isBlank()||description.isBlank())throw bad("Title and description are required");
        int duration=boundedInt(Objects.toString(first(b,"duration","durationMinutes"),null),120,1,600);String language=String.join(",",stringList(first(b,"language","languages")));if(language.isBlank())language="English";
        double rating=clamp(doubleValue(b.get("rating"),0),0,10);double imdb=clamp(doubleValue(b.get("imdbRating"),0),0,10);double critics=clamp(doubleValue(b.get("criticsRating"),0),0,100);
        LocalDate release=parseDate(b.get("releaseDate"));String status=Objects.toString(b.get("status"),Boolean.FALSE.equals(b.get("nowShowing"))?"coming_soon":"now_showing");if(!Set.of("now_showing","coming_soon","ended").contains(status))throw bad("Invalid movie status");
        String cast=writeJson(stringList(b.get("cast")));Object[] vals={title,description,Objects.toString(b.get("director"),""),cast,duration,language,rating,imdb,critics,boundedInt(Objects.toString(b.get("totalRatings"),null),0,0,1000000),Objects.toString(b.get("category"),""),Objects.toString(first(b,"posterUrl","poster"),""),Objects.toString(first(b,"bannerUrl","backdropUrl"),""),Objects.toString(b.get("trailerUrl"),""),release,status,Boolean.TRUE.equals(b.get("featured")),Objects.toString(b.get("ageRating"),"UA")};
        long movieId;
        if(id==null)movieId=com.cinemax.util.JdbcUtil.insert(jdbc,"INSERT INTO movies(title,description,director,cast_json,duration_minutes,language,rating,imdb_rating,critics_rating,total_ratings,category,poster_url,banner_url,trailer_url,release_date,status,featured,age_rating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",vals);
        else {jdbc.update("UPDATE movies SET title=?,description=?,director=?,cast_json=?,duration_minutes=?,language=?,rating=?,imdb_rating=?,critics_rating=?,total_ratings=?,category=?,poster_url=?,banner_url=?,trailer_url=?,release_date=?,status=?,featured=?,age_rating=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",append(vals,id));movieId=id;}
        jdbc.update("DELETE FROM movie_genres WHERE movie_id=?",movieId);List<String> genres=stringList(b.get("genre"));if(genres.isEmpty())genres=stringList(b.get("genres"));for(String g:genres.stream().map(String::trim).filter(x->!x.isBlank()).distinct().toList())jdbc.update("INSERT INTO movie_genres(movie_id,genre) VALUES (?,?)",movieId,g);
        return movieId;
    }

    private Map<String,Object> addShowTime(long movieId,Map<String,Object>b){
        Long theatreId=optionalLong(first(b,"theatreId","theatre"));if(theatreId!=null)theatre(theatreId);
        LocalDateTime start=parseDateTime(first(b,"date","startTime"));String time=Objects.toString(b.get("time"),TIME.format(start.toLocalTime()));String hall=Objects.toString(first(b,"hall","screen"),"Screen 1");String format=Objects.toString(b.get("format"),"2D");BigDecimal price=decimal(b.get("price"));if(price.signum()<=0)throw bad("Price must be positive");int total=boundedInt(Objects.toString(b.get("totalSeats"),null),80,1,500);
        long id=com.cinemax.util.JdbcUtil.insert(jdbc,"INSERT INTO show_times(movie_id,theatre_id,screen,show_time,format,start_time,price,total_seats) VALUES (?,?,?,?,?,?,?,?)",movieId,theatreId,hall,time,format,start,price,total);
        createSeats(id,total);return jdbc.queryForList("SELECT * FROM show_times WHERE id=?",id).stream().findFirst().map(r->showTimeMap(r,0)).orElseThrow();
    }

    private Map<String,Object> movieBase(Map<String,Object> row,boolean includeGenres){Map<String,Object>m=new LinkedHashMap<>();long id=((Number)row.get("id")).longValue();m.put("_id",String.valueOf(id));m.put("id",String.valueOf(id));m.put("title",row.get("title"));m.put("description",row.get("description"));m.put("director",row.get("director"));m.put("cast",readJson(Objects.toString(row.get("cast_json"),"[]")));m.put("duration",row.get("duration_minutes"));m.put("durationMinutes",row.get("duration_minutes"));m.put("language",csv(Objects.toString(row.get("language"),"English")));m.put("rating",row.get("rating"));m.put("avgRating",row.get("rating"));m.put("imdbRating",row.get("imdb_rating"));m.put("criticsRating",row.get("critics_rating"));m.put("totalRatings",row.get("total_ratings"));m.put("category",row.get("category"));m.put("posterUrl",row.get("poster_url"));m.put("bannerUrl",row.get("banner_url"));m.put("trailerUrl",row.get("trailer_url"));m.put("releaseDate",row.get("release_date")==null?null:row.get("release_date").toString());m.put("status",row.get("status"));m.put("featured",row.get("featured"));m.put("ageRating",row.get("age_rating"));m.put("createdAt",row.get("created_at"));m.put("updatedAt",row.get("updated_at"));m.put("genre",jdbc.queryForList("SELECT genre FROM movie_genres WHERE movie_id=? ORDER BY genre",String.class,id));return m;}
    private Map<String,Object> movieBase(ResultSet rs,boolean full)throws SQLException{Map<String,Object>r=new HashMap<>();for(String k:List.of("id","title","description","director","cast_json","duration_minutes","language","rating","imdb_rating","critics_rating","total_ratings","category","poster_url","banner_url","trailer_url","release_date","status","featured","age_rating","created_at","updated_at")){r.put(k,rs.getObject(k));}return movieBase(r,full);}
    private Map<String,Object> showTime(ResultSet rs)throws SQLException{return showTimeMap(resultMap(rs),rs.getInt("booked_count"));}
    private Map<String,Object> showTimeMap(Map<String,Object>r,int booked){long id=((Number)r.get("id")).longValue();LocalDateTime start=toLocalDateTime(r.get("start_time"));Map<String,Object>m=new LinkedHashMap<>();m.put("_id",String.valueOf(id));m.put("id",String.valueOf(id));m.put("movieId",String.valueOf(r.get("movie_id")));m.put("theatreId",r.get("theatre_id")==null?null:String.valueOf(r.get("theatre_id")));m.put("date",start);m.put("startTime",start);m.put("time",r.get("show_time"));m.put("hall",r.get("screen"));m.put("screen",r.get("screen"));m.put("totalSeats",r.get("total_seats"));m.put("bookedSeats",jdbc.queryForList("SELECT CONCAT(row_label,seat_number) FROM seats WHERE show_time_id=? AND status='BOOKED' ORDER BY row_label,seat_number",String.class,id));m.put("price",r.get("price"));m.put("format",r.get("format"));m.put("availableSeats",Math.max(0,((Number)r.get("total_seats")).intValue()-booked));return m;}
    private Map<String,Object> theatre(ResultSet rs)throws SQLException{Map<String,Object>m=new LinkedHashMap<>();String id=rs.getString("id");m.put("_id",id);m.put("id",id);m.put("name",rs.getString("name"));m.put("address",rs.getString("address"));m.put("city",rs.getString("city"));m.put("state",rs.getString("state"));m.put("pincode",rs.getString("pincode"));Map<String,Object>loc=new LinkedHashMap<>();loc.put("lat",rs.getDouble("latitude"));loc.put("lng",rs.getDouble("longitude"));m.put("location",loc);m.put("lat",rs.getDouble("latitude"));m.put("lng",rs.getDouble("longitude"));m.put("amenities",readJson(Objects.toString(rs.getString("amenities_json"),"[]")));m.put("screens",rs.getInt("screens"));m.put("rating",rs.getBigDecimal("rating"));m.put("totalReviews",rs.getInt("total_reviews"));m.put("image",rs.getString("image"));m.put("phone",rs.getString("phone"));m.put("isActive",rs.getBoolean("is_active"));m.put("createdAt",rs.getTimestamp("created_at").toLocalDateTime());return m;}
    private Map<String,Object> review(ResultSet rs)throws SQLException{Map<String,Object>m=new LinkedHashMap<>();m.put("_id",String.valueOf(rs.getLong("id")));Map<String,Object>u=new LinkedHashMap<>();u.put("_id",String.valueOf(rs.getLong("user_id")));u.put("name",rs.getString("user_name"));u.put("avatar",rs.getString("avatar"));m.put("user",u);m.put("userName",rs.getString("user_name"));m.put("rating",rs.getInt("rating"));m.put("comment",rs.getString("comment"));m.put("createdAt",rs.getTimestamp("created_at").toLocalDateTime());return m;}
    private Map<String,Object> user(long id,boolean favorites){Map<String,Object>u=jdbc.query("SELECT * FROM users WHERE id=?",(rs,n)->userBase(rs),id).stream().findFirst().orElseThrow(()->notFound("User not found"));if(favorites){u.put("favorites",jdbc.query("SELECT m.* FROM user_favorites f JOIN movies m ON m.id=f.movie_id WHERE f.user_id=? ORDER BY m.title",(rs,n)->movieBase(rs,false),id));u.put("watchHistory",jdbc.query("SELECT m.* FROM user_watch_history h JOIN movies m ON m.id=h.movie_id WHERE h.user_id=? ORDER BY h.watched_at DESC",(rs,n)->movieBase(rs,false),id));}return u;}
    private Map<String,Object> userBase(ResultSet rs)throws SQLException{String id=rs.getString("id");Map<String,Object>u=new LinkedHashMap<>();u.put("_id",id);u.put("id",id);u.put("name",rs.getString("name"));u.put("email",rs.getString("email"));u.put("role",rs.getString("role").toLowerCase(Locale.ROOT));u.put("avatar",rs.getString("avatar"));u.put("preferences",preferences(rs.getLong("id")));u.put("createdAt",rs.getTimestamp("created_at").toLocalDateTime());u.put("updatedAt",rs.getTimestamp("updated_at").toLocalDateTime());u.put("favorites",List.of());return u;}
    private Map<String,Object> preferences(long id){Map<String,Object>p=new LinkedHashMap<>();p.put("genres",jdbc.queryForList("SELECT pref_value FROM user_preferences WHERE user_id=? AND preference_type='genre' ORDER BY pref_value",String.class,id));p.put("languages",jdbc.queryForList("SELECT pref_value FROM user_preferences WHERE user_id=? AND preference_type='language' ORDER BY pref_value",String.class,id));return p;}
    private Map<String,Object> bookingMap(ResultSet rs,boolean includeUser)throws SQLException{long id=rs.getLong("id"),movieId=rs.getLong("movie_id"),userId=rs.getLong("user_id");Map<String,Object>m=new LinkedHashMap<>();m.put("_id",String.valueOf(id));m.put("id",String.valueOf(id));m.put("userId",String.valueOf(userId));if(includeUser){Map<String,Object>u=new LinkedHashMap<>();u.put("_id",String.valueOf(userId));u.put("name",rs.getString("user_name"));u.put("email",rs.getString("user_email"));m.put("user",u);}Map<String,Object> movie=new LinkedHashMap<>();movie.put("_id",String.valueOf(movieId));movie.put("title",rs.getString("movie_name"));movie.put("posterUrl",Objects.toString(rs.getString("poster_url"),""));movie.put("genre",jdbc.queryForList("SELECT genre FROM movie_genres WHERE movie_id=? ORDER BY genre",String.class,movieId));movie.put("duration",jdbc.queryForObject("SELECT duration_minutes FROM movies WHERE id=?",Integer.class,movieId));m.put("movie",movie);m.put("movieTitle",rs.getString("movie_title"));m.put("showTimeId",String.valueOf(rs.getLong("show_time_id")));m.put("showDate",rs.getTimestamp("show_date").toLocalDateTime());m.put("showTime",rs.getString("show_time"));m.put("hall",rs.getString("hall"));Object theatre=rs.getObject("theatre_id");m.put("theatreId",theatre==null?null:String.valueOf(theatre));m.put("theatreName",rs.getString("theatre_name"));m.put("theatreAddress",rs.getString("theatre_address"));m.put("city",rs.getString("city"));m.put("seats",jdbc.queryForList("SELECT CONCAT(row_label,seat_number) FROM seats WHERE booking_id=? ORDER BY row_label,seat_number",String.class,id));m.put("totalAmount",rs.getBigDecimal("total_amount"));m.put("paymentStatus",rs.getString("payment_status"));m.put("paymentIntentId",rs.getString("payment_intent_id"));m.put("bookingStatus",rs.getString("booking_status"));m.put("bookingCode",rs.getString("booking_code"));m.put("format",rs.getString("format"));m.put("createdAt",rs.getTimestamp("created_at").toLocalDateTime());m.put("updatedAt",rs.getTimestamp("updated_at").toLocalDateTime());return m;}

    private Map<String,Object> showTimeById(long id){return jdbc.query("SELECT * FROM show_times WHERE id=?",(rs,n)->showTimeMap(resultMap(rs),0),id).stream().findFirst().orElseThrow(()->notFound("Showtime not found"));}
    private void ensureAvailable(long showId,List<String> seats){Integer n=named.queryForObject("SELECT COUNT(*) FROM seats WHERE show_time_id=:sid AND status='AVAILABLE' AND CONCAT(row_label,seat_number) IN (:seats)",new MapSqlParameterSource().addValue("sid",showId).addValue("seats",seats),Integer.class);if(n==null||n!=seats.size())throw new ApiException(HttpStatus.CONFLICT,"One or more selected seats are unavailable");}
    private int reserveSeats(long bookingId,long showId,List<String> seats){return named.update("UPDATE seats SET status='BOOKED',booking_id=:bid WHERE show_time_id=:sid AND status='AVAILABLE' AND CONCAT(row_label,seat_number) IN (:seats)",new MapSqlParameterSource().addValue("bid",bookingId).addValue("sid",showId).addValue("seats",seats));}
    private long insertBooking(long userId,long movieId,long showId,Map<String,Object>st,Map<String,Object>theatre,List<String>seats,BigDecimal total,String payment){String code="BK"+UUID.randomUUID().toString().replace("-","").substring(0,12).toUpperCase(Locale.ROOT);LocalDateTime start=(LocalDateTime)st.get("date");return com.cinemax.util.JdbcUtil.insert(jdbc,"INSERT INTO bookings(user_id,movie_id,show_time_id,theatre_id,movie_title,show_date,show_time,hall,theatre_name,theatre_address,city,format,total_amount,payment_status,payment_intent_id,booking_status,booking_code) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",userId,movieId,showId,theatre==null?null:Long.valueOf((String)theatre.get("_id")),movie(movieId,false).get("title"),start,st.get("time"),st.get("hall"),theatre==null?"":theatre.get("name"),theatre==null?"":theatre.get("address"),theatre==null?"":theatre.get("city"),st.get("format"),total,"paid",payment,"confirmed",code);}
    private Map<String,Object> chooseTheatre(Object bookingTheatre,Object intentTheatre){Long id=optionalLong(bookingTheatre!=null?bookingTheatre:intentTheatre);return id==null?null:theatre(id);}
    private void createSeats(long showId,int total){int rows=(total+9)/10;for(int r=0;r<rows;r++){char row=(char)('A'+r);int count=Math.min(10,total-r*10);for(int n=1;n<=count;n++)jdbc.update("INSERT INTO seats(show_time_id,row_label,seat_number) VALUES (?,?,?)",showId,String.valueOf(row),n);}}
    private void replacePreferences(long user,String type,List<String> values){jdbc.update("DELETE FROM user_preferences WHERE user_id=? AND preference_type=?",user,type);for(String v:values.stream().map(String::trim).filter(x->!x.isBlank()).distinct().toList())jdbc.update("INSERT INTO user_preferences(user_id,preference_type,pref_value) VALUES (?,?,?)",user,type,v);}
    private List<String> cleanSeats(Object raw){List<String> seats=stringList(raw).stream().map(s->s.trim().toUpperCase(Locale.ROOT)).distinct().toList();if(seats.isEmpty()||seats.size()>10||!seats.stream().allMatch(s->s.matches("^[A-Z](10|[1-9])$")))throw bad("Choose 1 to 10 valid seats");return seats;}
    private List<String> csv(String s){return s==null||s.isBlank()?List.of():Arrays.stream(s.split(",")).map(String::trim).filter(x->!x.isBlank()).distinct().toList();}
    private List<String> stringList(Object x){if(x==null)return List.of();if(x instanceof Collection<?> c)return c.stream().filter(Objects::nonNull).map(Object::toString).toList();if(x instanceof String s)return csv(s);return List.of();}
    private Object readJson(String s){try{return json.readValue(s,new TypeReference<Object>(){});}catch(Exception e){return List.of();}}
    private String writeJson(Object o){try{return json.writeValueAsString(o);}catch(Exception e){throw new IllegalStateException("Could not encode JSON",e);}}
    private Map<?,?> objectMap(Object o){if(o instanceof Map<?,?> m)return m;throw bad("Booking data is required");}
    private Object first(Map<String,Object>m,String a,String b){return m.containsKey(a)?m.get(a):m.get(b);}
    private Object[] append(Object[] a,Object last){Object[] b=Arrays.copyOf(a,a.length+1);b[a.length]=last;return b;}
    private Map<String,Object> resultMap(ResultSet rs)throws SQLException{Map<String,Object>m=new HashMap<>();for(int i=1;i<=rs.getMetaData().getColumnCount();i++)m.put(rs.getMetaData().getColumnLabel(i).toLowerCase(Locale.ROOT),rs.getObject(i));return m;}
    private LocalDate parseDate(Object x){if(x==null||x.toString().isBlank())return LocalDate.now();try{return LocalDate.parse(x.toString().substring(0,10));}catch(Exception e){throw bad("Invalid releaseDate");}}
    private LocalDateTime parseDateTime(Object x){if(x==null)throw bad("Showtime date is required");try{String s=x.toString();return s.length()==10?LocalDate.parse(s).atTime(18,0):LocalDateTime.parse(s.length()==16?s+":00":s);}catch(Exception e){throw bad("Invalid showtime date");}}
    private LocalDateTime toLocalDateTime(Object o){if(o instanceof LocalDateTime d)return d;if(o instanceof java.sql.Timestamp t)return t.toLocalDateTime();return LocalDateTime.parse(o.toString().replace(' ','T'));}
    private BigDecimal decimal(Object o){try{return new BigDecimal(o.toString());}catch(Exception e){throw bad("Invalid amount");}}
    private double doubleValue(Object o,double fallback){try{return o==null?fallback:Double.parseDouble(o.toString());}catch(Exception e){return fallback;}}
    private double parseDouble(String s,double fallback){try{return Double.parseDouble(s);}catch(Exception e){return fallback;}}
    private double clamp(double x,double min,double max){return Double.isFinite(x)?Math.max(min,Math.min(max,x)):min;}
    private int boundedInt(String s,int fallback,int min,int max){try{return Math.max(min,Math.min(max,Integer.parseInt(s)));}catch(Exception e){return fallback;}}
    private long number(Object x,String field){try{return Long.parseLong(Objects.toString(x,""));}catch(Exception e){throw bad("Invalid "+field);}}
    private Long optionalLong(Object x){if(x==null||x.toString().isBlank())return null;return number(x,"id");}
    private double distance(double a,double b,double c,double d){double p=Math.PI/180,dl=(c-a)*p,dg=(d-b)*p;double x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dg/2)*Math.sin(dg/2);return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
    private ApiException bad(String s){return new ApiException(HttpStatus.BAD_REQUEST,s);}private ApiException notFound(String s){return new ApiException(HttpStatus.NOT_FOUND,s);}
}
