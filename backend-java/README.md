# Cinemax - Spring Boot + JDBC + MySQL

Letterboxd-style discovery + BookMyShow-style booking.
This is the **Java backend version** of Cinemax (original: Node.js + Express + MongoDB). Features and routes are the same; only the tech stack changed.

## Tech stack
Java 17 | Spring Boot 3.3 | Spring Web (REST) | **Spring JDBC (JdbcTemplate)** | MySQL 8 | Spring Security + JWT (jjwt) | BCrypt | Bean Validation | Stripe Java SDK | Maven
The existing React frontend is reused unchanged (same port 5000, same `/api/...` paths).

## Prerequisites
- JDK 17+ and Maven 3.9+
- MySQL 8 running locally (database `cinemaDB` is created automatically)

## Run
```bash
# 1. set DB credentials if yours differ from root/root
export DB_USER=root
export DB_PASSWORD=your_password

# 2. start the API on http://localhost:5000
mvn spring-boot:run
```
On first start the app creates all tables (`schema.sql`) and seeds demo data (`DataSeeder`), the same job `npm run seed` did.

| Role  | Email             | Password |
|-------|-------------------|----------|
| Admin | admin@cinema.com  | admin123 |
| User  | user@cinema.com   | user123  |

Environment variables: `DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD JWT_SECRET CORS_ORIGIN STRIPE_SECRET_KEY SEED`.
Leave `STRIPE_SECRET_KEY` empty to use mock payments in development.

Frontend: `cd frontend && npm install && npm start` (http://localhost:3000).

Health check: `GET http://localhost:5000/api/health` -> `{"status":"ok"}`

## REST API
| Feature | Method + Route | Access |
|---|---|---|
| Health | GET /api/health | public |
| Register / Login | POST /api/auth/register, /api/auth/login | public |
| Current user | GET /api/auth/me | login |
| Browse movies (filters) | GET /api/movies?genre=&language=&q=&nowShowing= | public |
| Movie detail | GET /api/movies/{id} | public |
| Showtimes of a movie | GET /api/movies/{id}/showtimes | public |
| Recommendations | GET /api/recommendations?genres=Action,Sci-Fi | public |
| All genres | GET /api/recommendations/genres | public |
| Seat map | GET /api/showtimes/{id}/seats | public |
| Checkout (payment intent) | POST /api/bookings/checkout | login |
| Create booking | POST /api/bookings | login |
| My bookings | GET /api/bookings/my | login |
| Admin stats | GET /api/admin/stats | ADMIN |
| Admin movies CRUD | POST/PUT/DELETE /api/admin/movies | ADMIN |
| Admin add showtime | POST /api/admin/showtimes | ADMIN |
| Admin all bookings | GET /api/admin/bookings | ADMIN |

## Project structure
```
src/main/java/com/cinemax
  controller/   REST endpoints (thin)
  service/      business rules + @Transactional booking
  repository/   JdbcTemplate SQL
  model/ dto/   records returned / received as JSON
  security/     JWT util + filter
  config/       SecurityConfig, DataSeeder
  exception/    ApiException + global handler
src/main/resources
  schema.sql    MySQL tables
  application.properties
```

## Design points to explain in the interview
1. **Layers:** Controller -> Service -> Repository. Controllers only map HTTP, services hold rules, repositories hold SQL.
2. **JdbcTemplate:** hand-written SQL with RowMapper and PreparedStatement parameters (no string concatenation, so no SQL injection). `NamedParameterJdbcTemplate` is used for dynamic filters and `IN (:list)` queries.
3. **Double booking is prevented in SQL:** `UPDATE seats SET status='BOOKED' ... WHERE status='AVAILABLE' AND label IN (...)` returns how many rows changed. If that is not the number of seats requested, the service throws and `@Transactional` rolls the whole booking back.
4. **MongoDB to SQL mapping:** documents became normalized tables (`movies`, `movie_genres`, `show_times`, `seats`, `bookings`, `users`) with foreign keys and ON DELETE CASCADE where it makes sense.
5. **Security:** stateless JWT in the `Authorization: Bearer` header, BCrypt password hashes, role-based access (`/api/admin/**` needs ADMIN), CORS limited to the frontend origin.
6. **Validation and errors:** `@Valid` DTOs plus one `@RestControllerAdvice` that returns `{ "message": ... }` with the right HTTP status.
