package com.cinemax.model;

public record User(long id, String name, String email, String passwordHash, String role) {}
