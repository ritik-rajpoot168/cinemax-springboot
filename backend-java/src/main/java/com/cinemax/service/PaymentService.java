package com.cinemax.service;

import com.cinemax.exception.ApiException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/** Stripe PaymentIntent wrapper. With no STRIPE_SECRET_KEY it runs in mock mode for local development. */
@Service
public class PaymentService {
    public record Intent(String id, String clientSecret, boolean mock) {}

    private final String secretKey;
    private final String webhookSecret;

    public PaymentService(@Value("${app.stripe.secret-key:}") String secretKey,
                          @Value("${app.stripe.webhook-secret:}") String webhookSecret) {
        this.secretKey = secretKey;
        this.webhookSecret = webhookSecret;
    }

    private boolean mock() {
        return secretKey == null || secretKey.isBlank();
    }

    public Intent createIntent(BigDecimal amountInr) {
        if (mock()) {
            String id = "mock_" + UUID.randomUUID();
            return new Intent(id, id + "_secret", true);
        }
        try {
            Stripe.apiKey = secretKey;
            PaymentIntent pi = PaymentIntent.create(PaymentIntentCreateParams.builder()
                    .setAmount(amountInr.multiply(BigDecimal.valueOf(100)).longValueExact())   // paise
                    .setCurrency("inr")
                    .setAutomaticPaymentMethods(PaymentIntentCreateParams.AutomaticPaymentMethods
                            .builder().setEnabled(true).build())
                    .build());
            return new Intent(pi.getId(), pi.getClientSecret(), false);
        } catch (StripeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment provider error");
        }
    }

    public boolean isPaid(String paymentRef) {
        if (paymentRef == null || paymentRef.isBlank()) return false;
        if (mock()) return paymentRef.startsWith("mock_");
        try {
            Stripe.apiKey = secretKey;
            return "succeeded".equals(PaymentIntent.retrieve(paymentRef).getStatus());
        } catch (StripeException e) {
            return false;
        }
    }

    public Event verifyWebhook(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe webhook is not configured");
        }
        try {
            return Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook signature");
        }
    }
}
