package com.cinemax.controller;

import com.cinemax.security.AuthUser;
import com.cinemax.service.MernCompatibilityService;
import com.cinemax.service.PaymentService;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class LegacyPaymentController {
    private final MernCompatibilityService api;
    private final PaymentService payments;
    public LegacyPaymentController(MernCompatibilityService api,PaymentService payments){this.api=api;this.payments=payments;}
    @PostMapping("/create-payment-intent") public Object create(@AuthenticationPrincipal AuthUser user,@RequestBody Map<String,Object> body){return api.createPayment(user.id(),body);}
    @PostMapping("/confirm") public Object confirm(@AuthenticationPrincipal AuthUser user,@RequestBody Map<String,Object> body){return api.confirmPayment(user.id(),body);}
    @PostMapping("/webhook") public Object webhook(@RequestBody String payload,@RequestHeader(value="Stripe-Signature",required=false) String signature){
        Event event=payments.verifyWebhook(payload,signature==null?"":signature);
        if("payment_intent.payment_failed".equals(event.getType())){
            StripeObject object=event.getDataObjectDeserializer().getObject().orElse(null);
            if(object instanceof PaymentIntent intent)api.paymentFailed(intent.getId());
        }
        return Map.of("received",true);
    }
}
