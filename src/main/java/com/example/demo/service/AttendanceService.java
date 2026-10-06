package com.example.demo.service;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.AttendanceRequest;
import com.example.demo.dto.QrGenerateRequest;
import com.example.demo.dto.QrResponse;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AttendanceService {

    @Autowired
    private QrSessionRepository qrSessionRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private StudentRepository studentRepository;

    public QrResponse generateQr(QrGenerateRequest request) {
        QrResponse response = new QrResponse();
        Optional<Teacher> teacherOpt = teacherRepository.findById(request.getTeacherId());
        Optional<CourseClass> classOpt = courseClassRepository.findByName(request.getClassName());

        if (teacherOpt.isEmpty() || classOpt.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Invalid teacher or class");
            return response;
        }

        QrSession qrSession = new QrSession();
        qrSession.setTeacher(teacherOpt.get());
        qrSession.setCourseClass(classOpt.get());
        qrSession.setToken(UUID.randomUUID().toString());
        qrSession.setGeneratedAt(LocalDateTime.now());
        qrSession.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        qrSessionRepository.save(qrSession);

        response.setSuccess(true);
        response.setMessage("QR Generated successfully");
        response.setToken(qrSession.getToken());
        response.setExpiresAt(qrSession.getExpiresAt());
        return response;
    }

    public QrResponse getActiveQr(String className) {
        QrResponse response = new QrResponse();
        Optional<CourseClass> classOpt = courseClassRepository.findByName(className);
        if (classOpt.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Invalid class");
            return response;
        }

        Optional<QrSession> qrOpt = qrSessionRepository.findTopByCourseClassAndExpiresAtAfterOrderByGeneratedAtDesc(classOpt.get(), LocalDateTime.now());
        
        if (qrOpt.isPresent()) {
            response.setSuccess(true);
            response.setMessage("Active QR found");
            response.setToken(qrOpt.get().getToken());
            response.setExpiresAt(qrOpt.get().getExpiresAt());
        } else {
            response.setSuccess(false);
            response.setMessage("No active QR found");
        }
        return response;
    }

    public ApiResponse markAttendance(AttendanceRequest request) {
        Optional<QrSession> qrOpt = qrSessionRepository.findByToken(request.getToken());
        
        if (qrOpt.isEmpty()) {
            return new ApiResponse(false, "Invalid QR Token");
        }

        QrSession qrSession = qrOpt.get();
        if (qrSession.getExpiresAt().isBefore(LocalDateTime.now())) {
            return new ApiResponse(false, "QR has expired");
        }

        String targetClassName = request.getClassName() != null && !request.getClassName().isEmpty() 
            ? request.getClassName() : qrSession.getCourseClass().getName();

        if (!qrSession.getCourseClass().getName().equals(targetClassName)) {
            return new ApiResponse(false, "QR is not for this class");
        }

        Student student;
        Optional<Student> studentOpt = request.getStudentId() != null ? studentRepository.findById(request.getStudentId()) : Optional.empty();
        if (studentOpt.isEmpty()) {
            studentOpt = studentRepository.findByRegisterNumber(request.getRegisterNumber());
        }
        
        if (studentOpt.isEmpty()) {
            return new ApiResponse(false, "Student does not exist. Attendance not accepted.");
        } else {
            student = studentOpt.get();
            if (!student.getCourseClass().getName().equals(targetClassName)) {
                return new ApiResponse(false, "Student does not belong to this class");
            }
        }
        
        if (!student.getName().equals(request.getStudentName())) {
            // Update the name just in case they typed a different variation
            student.setName(request.getStudentName());
            studentRepository.save(student);
        }

        if (attendanceRecordRepository.existsByStudentAndQrSession(student, qrSession)) {
            return new ApiResponse(false, "Attendance already marked for this session");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setStudent(student);
        record.setCourseClass(qrSession.getCourseClass());
        record.setQrSession(qrSession);
        record.setPresent(request.isPresent());
        record.setMarkedAt(LocalDateTime.now());

        attendanceRecordRepository.save(record);
        
        return new ApiResponse(true, "Attendance Marked Successfully");
    }

    public long getAttendanceCount(String token) {
        Optional<QrSession> qrOpt = qrSessionRepository.findByToken(token);
        if (qrOpt.isEmpty()) return 0;
        return attendanceRecordRepository.findAll().stream()
            .filter(r -> r.getQrSession().getId().equals(qrOpt.get().getId()))
            .count();
    }

    public java.util.List<java.util.Map<String, Object>> getSessionDetails(String token) {
        Optional<QrSession> qrOpt = qrSessionRepository.findByToken(token);
        if (qrOpt.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        QrSession qrSession = qrOpt.get();
        boolean isExpired = qrSession.getExpiresAt().isBefore(LocalDateTime.now());
        
        java.util.List<AttendanceRecord> records = attendanceRecordRepository.findAll().stream()
            .filter(r -> r.getQrSession().getId().equals(qrSession.getId()))
            .toList();

        return studentRepository.findAll().stream()
            .filter(s -> s.getCourseClass() != null && s.getCourseClass().getId().equals(qrSession.getCourseClass().getId()))
            .map(s -> {
                boolean submitted = records.stream().anyMatch(r -> r.getStudent().getId().equals(s.getId()));
                String status = submitted ? "Submitted" : (isExpired ? "Not Submitted" : "Pending");
                return java.util.Map.<String, Object>of(
                    "id", s.getId(),
                    "name", s.getName(),
                    "registerNumber", s.getRegisterNumber() != null ? s.getRegisterNumber() : "",
                    "status", status
                );
            })
            .toList();
    }
}
