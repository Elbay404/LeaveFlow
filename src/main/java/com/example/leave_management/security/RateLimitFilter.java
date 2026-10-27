package com.example.leave_management.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import com.example.leave_management.dto.error.ErrorResponse;
import org.springframework.web.filter.OncePerRequestFilter;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@Component
public class RateLimitFilter extends OncePerRequestFilter {


    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket createBucket(int capacity, Duration duration) {

        Refill refill = Refill.greedy(capacity, duration);  //intervally()

        Bandwidth limit = Bandwidth.classic(capacity, refill);

        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        Bucket bucket;

        if (path.equals("/api/auth/login")) {

            bucket = buckets.computeIfAbsent("login:" + clientIp,
                    key -> createBucket(5, Duration.ofMinutes(1)));

        } else if (path.equals("/api/auth/forgot-password")) {

            bucket = buckets.computeIfAbsent("forgot:" + clientIp, key -> createBucket(3, Duration.ofMinutes(1)));

        } else if (path.equals("/api/auth/reset-password")) {

            bucket = buckets.computeIfAbsent("reset:" + clientIp, key -> createBucket(5, Duration.ofMinutes(1)));

        } else {

            filterChain.doFilter(request, response);
            return;
        }

        if (!bucket.tryConsume(1)) {

            ErrorResponse error = new ErrorResponse(
                    429,
                    "Too many requests. Please try again later.",
                    LocalDateTime.now().format(FORMATTER)
            );

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());

            response.setHeader("Retry-After", "60");

            response.setContentType("application/json");

            response.getWriter().write("""
                    {
                         "status": %d,
                         "message": "%s",
                          "timestamp": "%s"
                    }
                    """.formatted(
                            error.status(),
                            error.message(),
                            error.timestamp()
                    )
            );

            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {

        String forwarded = request.getHeader("X-Forwarded-For");

        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}