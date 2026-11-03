# Cinemax — React + Spring Boot

This repository combines the existing Cinemax React application with the Java backend supplied in `cinemax-springboot.zip`.

## Technology

- Frontend: React 18, React Router, Tailwind CSS, Axios, Stripe Elements
- Backend: Java 17, Spring Boot 3.3, Spring JDBC, MySQL 8, Spring Security, JWT, Stripe Java SDK

## Run locally

Start MySQL, then start the API:

```bash
cd backend-java
export DB_USER=root
export DB_PASSWORD=your_password
mvn spring-boot:run
```

The API listens on `http://localhost:5000`. Database `cinemaDB` and the initial tables are created on startup. For local development without Stripe, leave `STRIPE_SECRET_KEY` empty; the API uses mock payment intents.

In another terminal, start React:

```bash
cd frontend
npm install
npm start
```

The React development server is at `http://localhost:3000` and proxies `/api` calls to the backend.

Seed accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cinema.com` | `admin123` |
| User | `user@cinema.com` | `user123` |

## Backend routes in the supplied Spring Boot conversion

| Feature | Routes |
|---|---|
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Movies | `GET /api/movies`, `GET /api/movies/{id}`, `GET /api/movies/{id}/showtimes` |
| Recommendations | `GET /api/recommendations`, `GET /api/recommendations/genres` |
| Seats | `GET /api/showtimes/{id}/seats` |
| Bookings | `POST /api/bookings/checkout`, `POST /api/bookings`, `GET /api/bookings/my` |
| Admin | `GET /api/admin/stats`, movie CRUD, add showtimes, `GET /api/admin/bookings` |

## API compatibility status

The React code is copied from [`ritik-rajpoot168/cinemax`](https://github.com/ritik-rajpoot168/cinemax) without UI changes. The ZIP's Spring backend is a partial conversion and does **not** yet implement the full API contract used by that React app. In particular, the current Spring code does not yet cover the MERN routes for theatres, profile/favorites/reviews, the original `/api/booking` and `/api/payment` flows, or the full movie/showtime JSON shape. Those flows need to be completed before this repository can be described as a drop-in replacement for the MERN app.

## Database and configuration

Configure with environment variables:

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN`, `STRIPE_SECRET_KEY`, and `SEED`.

The SQL schema is in `backend-java/src/main/resources/schema.sql`. The Spring implementation uses normalized MySQL tables and transactional seat reservation.
