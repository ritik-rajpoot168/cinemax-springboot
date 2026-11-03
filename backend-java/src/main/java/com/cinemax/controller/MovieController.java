package com.cinemax.controller;

import com.cinemax.security.AuthUser;
import com.cinemax.service.MernCompatibilityService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Routes and response shapes used by the original MERN React client. */
@RestController
@RequestMapping("/api/movies")
public class MovieController {
    private final MernCompatibilityService api;
    public MovieController(MernCompatibilityService api){this.api=api;}

    @GetMapping public Map<String,Object> list(@RequestParam Map<String,String> query){return api.movies(query);}
    @GetMapping("/featured") public Object featured(){return api.featured();}
    @GetMapping("/recommendations") public Object personalized(@AuthenticationPrincipal AuthUser user){return api.personalizedRecommendations(user.id());}
    @GetMapping("/{id}") public Object get(@PathVariable long id){return api.movie(id,true);}
    @PostMapping("/favorite/{id}") public Object favorite(@AuthenticationPrincipal AuthUser user,@PathVariable long id){return api.toggleFavorite(user.id(),id);}
    @PostMapping("/review/{id}") public Object review(@AuthenticationPrincipal AuthUser user,@PathVariable long id,@RequestBody Map<String,Object> body){return api.review(user.id(),id,body);}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public Object create(@RequestBody Map<String,Object> body){return api.createMovie(body);}
    @PutMapping("/{id}") public Object update(@PathVariable long id,@RequestBody Map<String,Object> body){return api.updateMovie(id,body);}
    @DeleteMapping("/{id}") public Object delete(@PathVariable long id){return api.deleteMovie(id);}
}
