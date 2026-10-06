package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/teacher/login")
    public ResponseEntity<LoginResponse> teacherLogin(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.teacherLogin(request));
    }

    @PostMapping("/student/login")
    public ResponseEntity<LoginResponse> studentLogin(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.studentLogin(request));
    }
}
