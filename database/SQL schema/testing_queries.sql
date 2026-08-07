Database SQL Queries

This document contains example SQL queries that demonstrate relational database operations that could support the IAPO system

Examples:
User Story 1: 	As an advisor, I want to view a student's completed and planned courses so that I can track their progress for graduation.*

    Purpose: 

    SQL:
SELECT
    s.StudentID,
    s.FirstName,
    s.LastName,
    c.CourseID,
    c.CourseName,
    c.Credits,
    ss.Status,
    sem.SemesterTerm,
    sem.Year
FROM Student s
JOIN Student_Schedule ss
    ON s.StudentID = ss.StudentID
JOIN Courses_Offered co
    ON ss.OfferedID = co.OfferedID
JOIN Course c
    ON co.CourseID = c.CourseID
JOIN Semester sem
    ON co.SemesterID = sem.SemesterID
WHERE s.StudentID = 100005;

    # User Story 2: 	As a student, I want to know which prerequisites I am missing so that I can take them on time.

    Purpose: 

    SQL:
    
    User Story 3: 	As a student, I want to view available courses by semester so that I can plan ahead to graduation on time.
    
    Purpose:

    SQL:
    
    User Story 4: 	As a department administrator, I want to manage course capacities so that students receive accurate academic plans based on available course seats.

    Purpose: 

    SQL:
    
    User Story 5: 	As an advisor, I want to review student academic schedules so that I can provide feedback and ensure students are following the right approach to graduation.

    Purpose:

    SQL:
