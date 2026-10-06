package com.example.demo.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
    private String className;
    private String classPassword;
    private String registerNumber;
}
