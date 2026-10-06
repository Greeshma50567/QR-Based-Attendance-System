package com.example.demo.repository;

import com.example.demo.entity.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {
    Optional<CourseClass> findByName(String name);
}
