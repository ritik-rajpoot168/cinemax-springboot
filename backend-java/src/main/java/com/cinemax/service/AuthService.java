package com.cinemax.service;

import com.cinemax.dto.AuthResponse;
import com.cinemax.dto.LoginRequest;
import com.cinemax.dto.RegisterRequest;
import com.cinemax.exception.ApiException;
import com.cinemax.model.User;
import com.cinemax.model.UserView;
import com.cinemax.repository.UserRepository;
import com.cinemax.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        long id = users.save(r.name().trim(), email, encoder.encode(r.password()), "USER");
        User u = users.findById(id).orElseThrow();
        return new AuthResponse(jwt.generate(u.id(), u.email(), u.role()), UserView.from(u));
    }

    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(r.password(), x.passwordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return new AuthResponse(jwt.generate(u.id(), u.email(), u.role()), UserView.from(u));
    }

    public UserView me(long userId) {
        return users.findById(userId).map(UserView::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
