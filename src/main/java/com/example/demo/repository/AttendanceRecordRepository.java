package com.example.demo.repository;

import com.example.demo.entity.AttendanceRecord;
import com.example.demo.entity.Student;
import com.example.demo.entity.QrSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    boolean existsByStudentAndQrSession(Student student, QrSession qrSession);
}
