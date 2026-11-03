package com.cinemax.controller;

import com.cinemax.dto.SeatSelectionRequest;
import com.cinemax.security.AuthUser;
import com.cinemax.service.MernCompatibilityService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/** Plural-path aliases retained for clients of the earlier Spring prototype. */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final MernCompatibilityService api;
    public BookingController(MernCompatibilityService api){this.api=api;}
    @PostMapping("/checkout") public Object checkout(@AuthenticationPrincipal AuthUser user,@RequestBody SeatSelectionRequest r){return api.createPayment(user.id(),Map.of("bookingData",Map.of("showTimeId",r.showTimeId(),"seats",r.seats())));}
    @PostMapping public Object create(@AuthenticationPrincipal AuthUser user,@RequestBody SeatSelectionRequest r){Map<String,Object> data=new java.util.LinkedHashMap<>();data.put("showTimeId",r.showTimeId());data.put("seats",r.seats());Map<String,Object> body=new java.util.LinkedHashMap<>();body.put("paymentIntentId",r.paymentRef());body.put("bookingData",data);return api.confirmPayment(user.id(),body);}
    @GetMapping("/my") public Object mine(@AuthenticationPrincipal AuthUser user){return api.userBookings(user.id());}
}
