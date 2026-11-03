package com.cinemax.controller;

import com.cinemax.service.MernCompatibilityService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final MernCompatibilityService api;
    public RecommendationController(MernCompatibilityService api){this.api=api;}
    @GetMapping public Object recommend(@RequestParam(required=false) String genres,@RequestParam(required=false) String exclude,@RequestParam(required=false) String limit){return api.globalRecommendations(genres,exclude,limit);}
    @GetMapping("/genres") public Object genres(){return api.genres();}
}
