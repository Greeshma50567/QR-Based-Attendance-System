package com.example.demo.dto;

import lombok.Data;

@Data
public class QrGenerateRequest {
    private Long teacherId;
    private String className;
}
