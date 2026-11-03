package com.cinemax.service;

import com.cinemax.dto.SeatSelectionRequest;
import com.cinemax.exception.ApiException;
import com.cinemax.model.BookingView;
import com.cinemax.model.ShowTime;
import com.cinemax.repository.BookingRepository;
import com.cinemax.repository.ShowTimeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class BookingService {
    private static final Pattern SEAT = Pattern.compile("^[A-H](10|[1-9])$");

    private final BookingRepository bookings;
    private final ShowTimeRepository showTimes;
    private final PaymentService payments;

    public BookingService(BookingRepository bookings, ShowTimeRepository showTimes, PaymentService payments) {
        this.bookings = bookings;
        this.showTimes = showTimes;
        this.payments = payments;
    }

    /** Step 1 (Checkout page): validate the seats and create a payment intent. */
    public Map<String, Object> checkout(SeatSelectionRequest r) {
        ShowTime st = loadShow(r.showTimeId());
        List<String> seats = cleanSeats(r.seats());
        if (bookings.countAvailable(st.id(), seats) != seats.size()) {
            throw new ApiException(HttpStatus.CONFLICT, "Some selected seats are no longer available");
        }
        BigDecimal total = st.price().multiply(BigDecimal.valueOf(seats.size()));
        PaymentService.Intent intent = payments.createIntent(total);
        return Map.of("paymentId", intent.id(), "clientSecret", intent.clientSecret(),
                "amount", total, "mock", intent.mock());
    }

    /**
     * Step 2 (after payment): create the booking and claim the seats.
     * Everything runs in ONE transaction: if any seat was taken meanwhile we throw and the
     * booking row is rolled back, so we never get a booking without all of its seats.
     */
    @Transactional
    public BookingView book(long userId, SeatSelectionRequest r) {
        ShowTime st = loadShow(r.showTimeId());
        List<String> seats = cleanSeats(r.seats());
        if (!payments.isPaid(r.paymentRef())) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "Payment not completed");
        }
        BigDecimal total = st.price().multiply(BigDecimal.valueOf(seats.size()));
        long bookingId = bookings.insert(userId, st.id(), total, "PAID", r.paymentRef());
        int claimed = bookings.reserveSeats(bookingId, st.id(), seats);
        if (claimed != seats.size()) {
            throw new ApiException(HttpStatus.CONFLICT, "Some selected seats were just booked by someone else");
        }
        return bookings.findById(bookingId).orElseThrow();
    }

    public List<BookingView> myBookings(long userId) {
        return bookings.findByUser(userId);
    }

    public List<BookingView> allBookings() {
        return bookings.findAll();
    }

    private ShowTime loadShow(Long id) {
        return showTimes.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Show not found"));
    }

    private List<String> cleanSeats(List<String> raw) {
        List<String> seats = raw.stream().map(s -> s.trim().toUpperCase()).distinct().toList();
        if (seats.isEmpty() || seats.size() > 10 || !seats.stream().allMatch(s -> SEAT.matcher(s).matches())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose 1 to 10 valid seats (A1 - H10)");
        }
        return seats;
    }
}
