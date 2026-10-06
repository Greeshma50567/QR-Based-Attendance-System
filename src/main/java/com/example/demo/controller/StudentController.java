package com.example.demo.controller;

import com.example.demo.entity.CourseClass;
import com.example.demo.entity.Student;
import com.example.demo.repository.CourseClassRepository;
import com.example.demo.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @GetMapping
    public ResponseEntity<?> getStudentsByClass(@RequestParam String className) {
        Optional<CourseClass> classOpt = courseClassRepository.findByName(className);
        if (classOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Class not found");
        }
        List<Map<String, Object>> students = studentRepository.findAll().stream()
                .filter(s -> s.getCourseClass() != null && s.getCourseClass().getName().equals(className))
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "name", s.getName(),
                        "registerNumber", s.getRegisterNumber() != null ? s.getRegisterNumber() : "",
                        "className", s.getCourseClass().getName()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(students);
    }

    @PostMapping
    public ResponseEntity<?> addStudent(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String registerNumber = request.get("registerNumber");
        String className = request.get("className");

        Optional<CourseClass> classOpt = courseClassRepository.findByName(className);
        if (classOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Class not found");
        }

        Student student = new Student();
        student.setName(name);
        student.setRegisterNumber(registerNumber);
        student.setUsername(name.replaceAll("\\s+", "").toLowerCase() + System.currentTimeMillis());
        student.setPassword("default");
        student.setCourseClass(classOpt.get());

        try {
            studentRepository.save(student);
            return ResponseEntity.ok(Map.<String, Object>of(
                    "id", student.getId(),
                    "name", student.getName(),
                    "registerNumber", student.getRegisterNumber(),
                    "className", student.getCourseClass().getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving student. Register number might already exist.");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Student not found");
        }

        Student student = studentOpt.get();
        student.setName(request.get("name"));
        student.setRegisterNumber(request.get("registerNumber"));

        try {
            studentRepository.save(student);
            return ResponseEntity.ok(Map.<String, Object>of(
                    "id", student.getId(),
                    "name", student.getName(),
                    "registerNumber", student.getRegisterNumber(),
                    "className", student.getCourseClass().getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating student. Register number might already exist.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        studentRepository.deleteById(id);
        return ResponseEntity.ok("Student deleted");
    }
}
