package com.cinemax.controller;

import com.cinemax.service.MernCompatibilityService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Objects;

/** Legacy admin endpoints consumed by the React admin dashboard. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final MernCompatibilityService api;
    public AdminController(MernCompatibilityService api){this.api=api;}
    @GetMapping("/stats") public Object stats(){return api.stats();}
    @GetMapping("/users") public Object users(){return api.allUsers();}
    @GetMapping("/bookings") public Object bookings(){return api.adminBookings();}
    @PutMapping("/users/{id}/role") public Object role(@PathVariable long id,@RequestBody Map<String,Object> body){return api.updateRole(id,Objects.toString(body.get("role"),""));}
    @PostMapping("/movies") @ResponseStatus(HttpStatus.CREATED) public Object createMovie(@RequestBody Map<String,Object> body){return api.createMovie(body);}
    @PutMapping("/movies/{id}") public Object updateMovie(@PathVariable long id,@RequestBody Map<String,Object> body){return api.updateMovie(id,body);}
    @DeleteMapping("/movies/{id}") public Object deleteMovie(@PathVariable long id){return api.deleteMovie(id);}
    @PostMapping("/showtimes") @ResponseStatus(HttpStatus.CREATED) public Object createShowTime(@RequestBody Map<String,Object> body){return api.createShowTime(body);}
}
