# Cinemax Spring Boot API

This Java 17 API uses Spring Boot, Spring JDBC, MySQL, JWT, and BCrypt. It preserves the original MERN React client's `/api/...` endpoints and JSON response contract. See the repository root README for setup, payment configuration, routes, and migration notes.

## Start

Configure `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and a strong `JWT_SECRET`, then run:

```bash
mvn spring-boot:run
```

The API listens on port 5000. `SEED=true` creates demo users, movies, theatres, and showtimes when those tables are empty. Leave `STRIPE_SECRET_KEY` unset only for local demo payment flow; production payment processing requires Stripe secrets and a verified webhook signing secret.

## Verify

```bash
mvn test
```

The integration suite uses H2 in MySQL compatibility mode and exercises the main React-facing user, discovery, recommendation, booking, payment, and admin flows.
