package com.example.demo.service;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.entity.Student;
import com.example.demo.entity.Teacher;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private com.example.demo.repository.CourseClassRepository courseClassRepository;

    public LoginResponse teacherLogin(LoginRequest request) {
        Optional<Teacher> teacherOpt = teacherRepository.findByUsername(request.getUsername());
        LoginResponse response = new LoginResponse();
        
        // If the teacher doesn't exist, create a new one on the fly (since we want flexible login)
        if (!teacherOpt.isPresent()) {
            Teacher newTeacher = new Teacher();
            newTeacher.setUsername(request.getUsername());
            newTeacher.setPassword(request.getPassword());
            // just use username as name if name isn't provided separately
            newTeacher.setName(request.getUsername());
            teacherRepository.save(newTeacher);
            teacherOpt = Optional.of(newTeacher);
        } else if (!teacherOpt.get().getPassword().equals(request.getPassword())) {
            // Teacher exists but password doesn't match
            response.setSuccess(false);
            response.setMessage("Invalid teacher credentials");
            return response;
        }

        // Now handle Class login/creation
        if (request.getClassName() != null && !request.getClassName().trim().isEmpty()) {
            String className = request.getClassName().trim();
            String classPassword = request.getClassPassword() == null ? "" : request.getClassPassword();

            Optional<com.example.demo.entity.CourseClass> classOpt = courseClassRepository.findByName(className);
            if (classOpt.isPresent()) {
                // Class exists, verify password
                com.example.demo.entity.CourseClass existingClass = classOpt.get();
                if (existingClass.getPassword() != null && !existingClass.getPassword().equals(classPassword)) {
                    response.setSuccess(false);
                    response.setMessage("Invalid Password");
                    return response;
                }
                // Password matches
            } else {
                // Class doesn't exist, create it with password
                com.example.demo.entity.CourseClass newClass = new com.example.demo.entity.CourseClass();
                newClass.setName(className);
                newClass.setPassword(classPassword);
                courseClassRepository.save(newClass);
            }
            response.setClassName(className);
        }

        response.setSuccess(true);
        response.setMessage("Login successful");
        response.setId(teacherOpt.get().getId());
        response.setName(teacherOpt.get().getName());
        response.setRole("TEACHER");
        return response;
    }

    public LoginResponse studentLogin(LoginRequest request) {
        LoginResponse response = new LoginResponse();
        
        // Ensure class name is provided
        if (request.getClassName() == null || request.getClassName().trim().isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Class Name is required");
            return response;
        }

        String className = request.getClassName().trim();
        String classPassword = request.getClassPassword() == null ? "" : request.getClassPassword();

        Optional<com.example.demo.entity.CourseClass> classOpt = courseClassRepository.findByName(className);
        if (!classOpt.isPresent()) {
            response.setSuccess(false);
            response.setMessage("Class does not exist. Please contact your teacher.");
            return response;
        }

        com.example.demo.entity.CourseClass courseClass = classOpt.get();
        if (courseClass.getPassword() != null && !courseClass.getPassword().equals(classPassword)) {
            response.setSuccess(false);
            response.setMessage("Invalid Class Password");
            return response;
        }

        String rawStudentName = request.getUsername();
        if (rawStudentName == null || rawStudentName.trim().isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Student Name is required");
            return response;
        }
        final String studentName = rawStudentName;
        
        String registerNumber = request.getRegisterNumber();
        if (registerNumber == null || registerNumber.trim().isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Register Number is required");
            return response;
        }

        Optional<Student> studentOpt = studentRepository.findAll().stream()
            .filter(s -> s.getName().equalsIgnoreCase(studentName) && s.getRegisterNumber().equalsIgnoreCase(registerNumber) && s.getCourseClass().getId().equals(courseClass.getId()))
            .findFirst();

        if (!studentOpt.isPresent()) {
            response.setSuccess(false);
            response.setMessage("Student not found in this class. Please check your Name and Register Number.");
            return response;
        }
        
        Student student = studentOpt.get();

        response.setSuccess(true);
        response.setMessage("Login successful");
        response.setId(student.getId());
        response.setName(student.getName());
        response.setRole("STUDENT");
        response.setClassName(className);
        response.setRegisterNumber(student.getRegisterNumber());
        return response;
    }
}
