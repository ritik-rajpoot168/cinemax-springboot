# Cinemax - React + Spring Boot

Cinemax keeps the original React interface and replaces the Node/Express/MongoDB API with a Java 17, Spring Boot, and MySQL REST API. The backend exposes the original `/api/...` route paths and Mongo-style `_id`/response fields expected by the React screens.

## Stack

- Frontend: React 18, React Router, Tailwind CSS, Axios, Stripe Elements
- Backend: Java 17, Spring Boot 3.3, Spring JDBC, MySQL 8, Spring Security, JWT, BCrypt
- Payments: Stripe PaymentIntents when configured; a clearly indicated demo intent is used locally when `STRIPE_SECRET_KEY` is empty

## Run locally

Use Java 17+, Maven 3.9+, Node.js, npm, and MySQL 8. Create the `cinemaDB` database or allow MySQL to create it using the configured account.

Start the API from `backend-java`:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=cinemaDB
export DB_USER=root
export DB_PASSWORD=your_password
export JWT_SECRET='replace-with-a-random-secret-of-at-least-32-characters'
mvn spring-boot:run
```

Start the React app from `frontend` in another terminal:

```bash
npm ci
npm start
```

Open `http://localhost:3000`. The Create React App development proxy forwards API requests to `http://localhost:5000`.

The API seeds demo movies, theatres, showtimes, and accounts on an empty database when `SEED=true` (the default):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cinema.com` | `admin123` |
| User | `user@cinema.com` | `user123` |

Change or disable these demo credentials and seed behavior before any public deployment.

## Payments

For real test/live card payments, configure `STRIPE_SECRET_KEY` on the backend and `REACT_APP_STRIPE_PUBLISHABLE_KEY` on the frontend. For local UI/API work without Stripe keys, the backend issues a demo payment intent and the UI completes the booking without charging a card. Configure `STRIPE_WEBHOOK_SECRET` to verify Stripe webhooks. The server computes the total from stored ticket prices, tax, and convenience fees; it does not trust the amount sent by the browser.

## React API compatibility

The Spring API implements the routes used by the existing React app:

| Feature | Routes |
|---|---|
| Health | `GET /`, `GET /api/health` |
| Authentication/profile | `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/profile` |
| Movie catalog | `GET /api/movies`, `/featured`, `/{id}`; admin movie create/update/delete |
| Favorites/reviews | `POST /api/movies/favorite/{id}`, `POST /api/movies/review/{id}` |
| Recommendations | `GET /api/movies/recommendations`, `GET /api/recommendations`, `/genres` |
| Theatres | `GET /api/theatres`, `GET /api/theatres/{id}` |
| Seats/bookings | `GET /api/booking/seats/{movieId}/{showTimeId}`, `GET /api/booking/my-bookings`, `GET /api/booking/{id}`, `PUT /api/booking/cancel/{id}` |
| Payment | `POST /api/payment/create-payment-intent`, `/confirm`, `/webhook` |
| Admin | `GET /api/admin/stats`, `/users`, `/bookings`; user role and catalog management |

Booking confirmation claims all selected seats in one database transaction. If a seat is no longer available, booking creation rolls back. Cancelling a booking releases its seats. Authenticated access is scoped to the current user; admin routes require the `ADMIN` role.

The original React project remains in `frontend/`. A small checkout change enables local demo payments when Stripe is not configured; normal Stripe card checkout remains available when both Stripe keys are set.

## Data migration and production setup

This repo provides the relational schema and demo seeding, but does not automatically import existing MongoDB users, movies, reviews, theatres, or bookings. Export and migrate the MERN data before switching to this database. Back up an existing MySQL database before updating it to the expanded schema.

For production hosting, deploy the Spring API and MySQL separately, set the frontend's `REACT_APP_API_URL` to the API origin, set `CORS_ORIGIN` to the frontend origin, use strong JWT and database secrets, configure Stripe keys/webhook signing, and set `SEED=false` after preparing production data.

## Tests

```bash
cd backend-java && mvn test
cd ../frontend && npm run build
```

Spring integration tests use an in-memory H2 database in MySQL compatibility mode. They cover the React API response shapes, authentication, role checks, profile/preferences, favorites/reviews, movie discovery, theatre lookup, payment and seat reservations, cancellation, and admin statistics.
