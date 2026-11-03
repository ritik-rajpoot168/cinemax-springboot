package com.cinemax.controller;

import com.cinemax.security.AuthUser;
import com.cinemax.service.MernCompatibilityService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Path-compatible endpoints used by Cinemax's original React client. */
@RestController
@RequestMapping("/api/booking")
public class LegacyBookingController {
    private final MernCompatibilityService api;
    public LegacyBookingController(MernCompatibilityService api){this.api=api;}
    @GetMapping("/my-bookings") public Object mine(@AuthenticationPrincipal AuthUser user){return api.userBookings(user.id());}
    @GetMapping("/seats/{movieId}/{showTimeId}") public Object seats(@PathVariable long movieId,@PathVariable long showTimeId){return api.bookedSeats(movieId,showTimeId);}
    @GetMapping("/{id}") public Object one(@AuthenticationPrincipal AuthUser user,@PathVariable long id){return api.booking(id,user.id());}
    @PutMapping("/cancel/{id}") public Object cancel(@AuthenticationPrincipal AuthUser user,@PathVariable long id){return api.cancelBooking(user.id(),id);}
}
