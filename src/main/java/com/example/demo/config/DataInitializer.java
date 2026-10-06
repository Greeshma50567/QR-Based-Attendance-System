package com.example.demo.config;

import com.example.demo.entity.CourseClass;
import com.example.demo.entity.Student;
import com.example.demo.entity.Teacher;
import com.example.demo.repository.CourseClassRepository;
import com.example.demo.repository.StudentRepository;
import com.example.demo.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (teacherRepository.count() == 0) {
                Teacher teacher = new Teacher();
                teacher.setUsername("teacher1");
                teacher.setPassword("password");
                teacher.setName("Mr. Smith");
                teacherRepository.save(teacher);
            }

            if (courseClassRepository.count() == 0) {
                CourseClass classA = new CourseClass();
                classA.setName("Class A");
                courseClassRepository.save(classA);

                CourseClass classB = new CourseClass();
                classB.setName("Class B");
                courseClassRepository.save(classB);

                CourseClass classC = new CourseClass();
                classC.setName("Class C");
                courseClassRepository.save(classC);

                if (studentRepository.count() == 0) {
                    Student student1 = new Student();
                    student1.setUsername("student1");
                    student1.setPassword("password");
                    student1.setName("Alice");
                    student1.setRegisterNumber("REG001");
                    student1.setCourseClass(classA);
                    studentRepository.save(student1);

                    Student student2 = new Student();
                    student2.setUsername("student2");
                    student2.setPassword("password");
                    student2.setName("Bob");
                    student2.setRegisterNumber("REG002");
                    student2.setCourseClass(classB);
                    studentRepository.save(student2);
                }
            }
        };
    }
}
