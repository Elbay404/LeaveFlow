package com.example.leave_management.service;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;

    public JwtService(@Value("${jwt.secret}") String secret){
        this.secretKey= Keys.hmacShaKeyFor(secret.getBytes()); //create a cryptographic key
    }

    public String generateToken(String email ,String role,Integer tokenVersion){

        Date now = new Date();
        Date expiration = new Date(now.getTime()+ 1000 * 60 * 60);

        return Jwts.builder()
                .subject(email)
                .claim("role",role)
                .claim("tokenVersion", tokenVersion)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    public String extractEmail(String token) {

        Claims claims = Jwts.parser()//to read and verify the jwt
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token) //read and verify the signature
                .getPayload();

        return claims.getSubject();
    }


    public Integer extractTokenVersion(String token) {

        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("tokenVersion", Integer.class); //vonvert to int
    }

}
