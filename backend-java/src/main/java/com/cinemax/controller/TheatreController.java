package com.cinemax.controller;

import com.cinemax.service.MernCompatibilityService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/theatres")
public class TheatreController {
    private final MernCompatibilityService api;
    public TheatreController(MernCompatibilityService api){this.api=api;}
    @GetMapping public Object list(@RequestParam Map<String,String> query){return api.theatres(query.get("city"),query.get("lat"),query.get("lng"),query.get("limit"));}
    @GetMapping("/{id}") public Object get(@PathVariable long id){return api.theatre(id);}
}
