package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class QrResponse {
    private boolean success;
    private String message;
    private String token;
    private LocalDateTime expiresAt;
}
