CREATE TABLE IF NOT EXISTS users (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  duration_minutes INT          NOT NULL DEFAULT 120,
  language         VARCHAR(40)  NOT NULL DEFAULT 'English',
  rating           DECIMAL(3,1) NOT NULL DEFAULT 0,
  poster_url       VARCHAR(500),
  backdrop_url     VARCHAR(500),
  release_date     DATE,
  now_showing      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id BIGINT      NOT NULL,
  genre    VARCHAR(40) NOT NULL,
  PRIMARY KEY (movie_id, genre),
  CONSTRAINT fk_mg_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS show_times (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  movie_id   BIGINT        NOT NULL,
  screen     VARCHAR(40)   NOT NULL,
  start_time DATETIME      NOT NULL,
  price      DECIMAL(8,2)  NOT NULL,
  CONSTRAINT fk_st_movie FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  INDEX idx_st_movie_time (movie_id, start_time)
);

CREATE TABLE IF NOT EXISTS bookings (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id        BIGINT        NOT NULL,
  show_time_id   BIGINT        NOT NULL,
  total_amount   DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20)   NOT NULL DEFAULT 'PAID',
  payment_ref    VARCHAR(100),
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_b_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_b_show FOREIGN KEY (show_time_id) REFERENCES show_times(id),
  INDEX idx_b_user (user_id)
);

CREATE TABLE IF NOT EXISTS seats (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  show_time_id BIGINT      NOT NULL,
  row_label    CHAR(1)     NOT NULL,
  seat_number  INT         NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE',
  booking_id   BIGINT NULL,
  UNIQUE KEY uq_seat (show_time_id, row_label, seat_number),
  CONSTRAINT fk_seat_show FOREIGN KEY (show_time_id) REFERENCES show_times(id) ON DELETE CASCADE,
  CONSTRAINT fk_seat_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
