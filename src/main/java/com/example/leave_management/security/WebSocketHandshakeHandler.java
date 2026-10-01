package com.example.leave_management.security;

import com.example.leave_management.entity.User;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

public class WebSocketHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {

        Object user = attributes.get("user");

        if (user instanceof User authenticatedUser) {
            return new WebSocketPrincipal(authenticatedUser.getEmail());
        }

        return null;
    }
}