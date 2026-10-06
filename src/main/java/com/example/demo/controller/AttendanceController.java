package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.AttendanceRequest;
import com.example.demo.dto.QrGenerateRequest;
import com.example.demo.dto.QrResponse;
import com.example.demo.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/generate-qr")
    public ResponseEntity<QrResponse> generateQr(@RequestBody QrGenerateRequest request) {
        return ResponseEntity.ok(attendanceService.generateQr(request));
    }

    @GetMapping("/active-qr")
    public ResponseEntity<QrResponse> getActiveQr(@RequestParam String className) {
        return ResponseEntity.ok(attendanceService.getActiveQr(className));
    }

    @PostMapping("/mark")
    public ResponseEntity<ApiResponse> markAttendance(@RequestBody AttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.markAttendance(request));
    }

    @GetMapping("/session/{token}/count")
    public ResponseEntity<Long> getAttendanceCount(@PathVariable String token) {
        return ResponseEntity.ok(attendanceService.getAttendanceCount(token));
    }

    @GetMapping("/session/{token}/details")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getSessionDetails(@PathVariable String token) {
        return ResponseEntity.ok(attendanceService.getSessionDetails(token));
    }
}
