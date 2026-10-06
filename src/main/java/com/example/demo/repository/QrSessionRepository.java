package com.example.demo.repository;

import com.example.demo.entity.QrSession;
import com.example.demo.entity.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.time.LocalDateTime;

public interface QrSessionRepository extends JpaRepository<QrSession, Long> {
    Optional<QrSession> findByToken(String token);
    Optional<QrSession> findTopByCourseClassAndExpiresAtAfterOrderByGeneratedAtDesc(CourseClass courseClass, LocalDateTime now);
}
