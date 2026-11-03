package com.cinemax.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserView(long id, String name, String email, String role) {
    @JsonProperty("_id")
    public long legacyId() { return id; }

    public static UserView from(User u) {
        return new UserView(u.id(), u.name(), u.email(), u.role());
    }
}
