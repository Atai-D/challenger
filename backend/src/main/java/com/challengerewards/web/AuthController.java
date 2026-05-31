package com.challengerewards.web;

import com.challengerewards.service.AuthService;
import com.challengerewards.service.AuthService.Session;
import com.challengerewards.web.Dtos.LoginRequest;
import com.challengerewards.web.Dtos.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    public static String token(String authHeader) {
        if (authHeader == null) return null;
        return authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    }

    @PostMapping("/login")
    public Session login(@RequestBody LoginRequest req) {
        return auth.login(req.username(), req.password());
    }

    @PostMapping("/register")
    public Session register(@RequestBody RegisterRequest req) {
        return auth.register(req.username(), req.password(), req.role(), req.displayName());
    }

    @GetMapping("/me")
    public Session me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Session s = auth.resolve(token(authHeader));
        if (s == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return s;
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        auth.logout(token(authHeader));
    }
}
