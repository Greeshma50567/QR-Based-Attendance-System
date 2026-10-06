package com.example.demo.controller;

import com.example.demo.entity.CourseClass;
import com.example.demo.repository.CourseClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "*")
public class ClassController {

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private com.example.demo.repository.StudentRepository studentRepository;
    
    @Autowired
    private com.example.demo.repository.QrSessionRepository qrSessionRepository;
    
    @Autowired
    private com.example.demo.repository.AttendanceRecordRepository attendanceRecordRepository;

    @GetMapping
    public ResponseEntity<List<String>> getAllClasses() {
        List<String> classNames = courseClassRepository.findAll().stream()
                .map(CourseClass::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(classNames);
    }

    @PostMapping("/{name}")
    public ResponseEntity<String> createClass(@PathVariable String name) {
        if (courseClassRepository.findByName(name).isPresent()) {
            return ResponseEntity.badRequest().body("Class already exists");
        }
        CourseClass newClass = new CourseClass();
        newClass.setName(name);
        courseClassRepository.save(newClass);
        return ResponseEntity.ok("Class created successfully");
    }

    @org.springframework.transaction.annotation.Transactional
    @DeleteMapping("/{name}")
    public ResponseEntity<String> deleteClass(@PathVariable String name) {
        try {
            return courseClassRepository.findByName(name)
                    .map(courseClass -> {
                        // Manually delete related entities to avoid foreign key constraints
                        attendanceRecordRepository.deleteAll(attendanceRecordRepository.findAll().stream()
                            .filter(a -> a.getCourseClass().getId().equals(courseClass.getId()))
                            .collect(Collectors.toList()));
                            
                        qrSessionRepository.deleteAll(qrSessionRepository.findAll().stream()
                            .filter(q -> q.getCourseClass().getId().equals(courseClass.getId()))
                            .collect(Collectors.toList()));
                            
                        studentRepository.deleteAll(studentRepository.findAll().stream()
                            .filter(s -> s.getCourseClass() != null && s.getCourseClass().getId().equals(courseClass.getId()))
                            .collect(Collectors.toList()));
                            
                        courseClassRepository.delete(courseClass);
                        return ResponseEntity.ok("Class deleted successfully");
                    })
                    .orElse(ResponseEntity.badRequest().body("Class not found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting class: " + e.getMessage());
        }
    }

    @PutMapping("/{oldName}")
    public ResponseEntity<String> updateClass(@PathVariable String oldName, @RequestParam String newName) {
        if (courseClassRepository.findByName(newName).isPresent()) {
            return ResponseEntity.badRequest().body("Class with the new name already exists");
        }
        return courseClassRepository.findByName(oldName)
                .map(courseClass -> {
                    courseClass.setName(newName);
                    courseClassRepository.save(courseClass);
                    return ResponseEntity.ok("Class updated successfully");
                })
                .orElse(ResponseEntity.badRequest().body("Class not found"));
    }
}
