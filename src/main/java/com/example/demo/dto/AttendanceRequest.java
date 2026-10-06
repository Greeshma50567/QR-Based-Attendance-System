package com.example.demo.dto;

import lombok.Data;

@Data
public class AttendanceRequest {
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private String className;
    private String token;
    private boolean present;
}
