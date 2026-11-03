CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'USER',
  avatar VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id BIGINT NOT NULL,
  preference_type VARCHAR(20) NOT NULL,
  pref_value VARCHAR(80) NOT NULL,
  PRIMARY KEY (user_id, preference_type, pref_value),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS movies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  director VARCHAR(150),
  cast_json TEXT,
  duration_minutes INT NOT NULL DEFAULT 120,
  language VARCHAR(500) NOT NULL DEFAULT 'English',
  rating DECIMAL(4,1) NOT NULL DEFAULT 0,
  imdb_rating DECIMAL(4,1) NOT NULL DEFAULT 0,
  critics_rating DECIMAL(5,1) NOT NULL DEFAULT 0,
  total_ratings INT NOT NULL DEFAULT 0,
  category VARCHAR(80) NOT NULL DEFAULT '',
  poster_url VARCHAR(1000) NOT NULL DEFAULT '',
  banner_url VARCHAR(1000) NOT NULL DEFAULT '',
  trailer_url VARCHAR(1000) NOT NULL DEFAULT '',
  release_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'now_showing',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  age_rating VARCHAR(20) NOT NULL DEFAULT 'UA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id BIGINT NOT NULL,
  genre VARCHAR(40) NOT NULL,
  PRIMARY KEY (movie_id, genre),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id BIGINT NOT NULL,
  movie_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, movie_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_watch_history (
  user_id BIGINT NOT NULL,
  movie_id BIGINT NOT NULL,
  watched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, movie_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS theatres (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL DEFAULT '',
  pincode VARCHAR(20) NOT NULL DEFAULT '',
  latitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  longitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  amenities_json TEXT,
  screens INT NOT NULL DEFAULT 3,
  rating DECIMAL(3,1) NOT NULL DEFAULT 4.2,
  total_reviews INT NOT NULL DEFAULT 0,
  image VARCHAR(1000) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS show_times (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  movie_id BIGINT NOT NULL,
  theatre_id BIGINT,
  screen VARCHAR(80) NOT NULL DEFAULT 'Screen 1',
  show_time VARCHAR(30) NOT NULL DEFAULT '',
  format VARCHAR(20) NOT NULL DEFAULT '2D',
  start_time DATETIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_seats INT NOT NULL DEFAULT 80,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (theatre_id) REFERENCES theatres(id),
  INDEX idx_st_movie_time (movie_id, start_time)
);
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  movie_id BIGINT NOT NULL,
  show_time_id BIGINT NOT NULL,
  theatre_id BIGINT,
  movie_title VARCHAR(200) NOT NULL,
  show_date DATETIME NOT NULL,
  show_time VARCHAR(30) NOT NULL,
  hall VARCHAR(80) NOT NULL,
  theatre_name VARCHAR(180) NOT NULL DEFAULT '',
  theatre_address VARCHAR(500) NOT NULL DEFAULT '',
  city VARCHAR(100) NOT NULL DEFAULT '',
  format VARCHAR(20) NOT NULL DEFAULT '2D',
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_intent_id VARCHAR(120),
  booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  booking_code VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (show_time_id) REFERENCES show_times(id),
  FOREIGN KEY (theatre_id) REFERENCES theatres(id),
  INDEX idx_booking_user (user_id, created_at),
  INDEX idx_booking_payment (payment_status, created_at)
);
CREATE TABLE IF NOT EXISTS seats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  show_time_id BIGINT NOT NULL,
  row_label CHAR(1) NOT NULL,
  seat_number INT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE',
  booking_id BIGINT,
  UNIQUE KEY uq_seat (show_time_id, row_label, seat_number),
  FOREIGN KEY (show_time_id) REFERENCES show_times(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
CREATE TABLE IF NOT EXISTS payment_intents (
  intent_id VARCHAR(120) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  show_time_id BIGINT NOT NULL,
  seats_json TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  theatre_id BIGINT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS movie_reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  movie_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_movie_review_user (movie_id, user_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
