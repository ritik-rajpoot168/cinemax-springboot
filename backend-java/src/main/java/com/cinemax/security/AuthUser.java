package com.cinemax.security;

/** The logged-in user taken from the JWT; injected with @AuthenticationPrincipal. */
public record AuthUser(long id, String email, String role) {}
