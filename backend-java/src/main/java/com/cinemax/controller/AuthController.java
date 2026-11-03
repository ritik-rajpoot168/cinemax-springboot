package com.cinemax.controller;

import com.cinemax.dto.AuthResponse;
import com.cinemax.dto.LoginRequest;
import com.cinemax.dto.RegisterRequest;
import com.cinemax.model.UserView;
import com.cinemax.security.AuthUser;
import com.cinemax.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        return auth.register(r);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        return auth.login(r);
    }

    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal AuthUser user) {
        return auth.me(user.id());
    }
}
