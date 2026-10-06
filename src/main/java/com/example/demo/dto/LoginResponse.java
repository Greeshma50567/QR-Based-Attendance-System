package com.example.demo.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private boolean success;
    private String message;
    private Long id;
    private String name;
    private String role; // TEACHER or STUDENT
    private String className; // If student
    private String registerNumber; // If student
}
