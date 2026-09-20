package com.example.leave_management.config;

import com.example.leave_management.dto.error.ErrorResponse;
import com.example.leave_management.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }



    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(AbstractHttpConfigurer::disable)

                .cors(cors -> {})

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS //no session server
                        )
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/ldap/test",
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                "/swagger-ui/**",
                                "/v3/api-docs/**")
                        .permitAll()

                        .requestMatchers("/api/ldap/migrate/**")
                        .hasRole("HR")

                        .anyRequest()
                        .authenticated()
                )

                .exceptionHandling(exception -> exception

                        .authenticationEntryPoint((request, response, authException) -> {

                            ErrorResponse error = new ErrorResponse(
                                    HttpStatus.UNAUTHORIZED.value(),
                                    "Authentication required",
                                    LocalDateTime.now().format(FORMATTER)
                            );

                            response.setStatus(
                                    HttpStatus.UNAUTHORIZED.value()
                            );

                            response.setContentType("application/json");

                            response.getWriter().write(
                                    """
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
                        })

                        .accessDeniedHandler((request, response, accessDeniedException) -> {

                            ErrorResponse error = new ErrorResponse(
                                    HttpStatus.FORBIDDEN.value(),
                                    "Access denied",
                                    LocalDateTime.now().format(FORMATTER)
                            );

                            response.setStatus(
                                    HttpStatus.FORBIDDEN.value()
                            );

                            response.setContentType("application/json");

                            response.getWriter().write(
                                    """
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
                        })
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

}
