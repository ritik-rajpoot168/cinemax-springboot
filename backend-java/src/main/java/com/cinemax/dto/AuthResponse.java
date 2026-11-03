package com.cinemax.dto;

import com.cinemax.model.UserView;

public record AuthResponse(String token, UserView user) {}
