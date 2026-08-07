Database SQL Queries

This document contains example SQL queries that demonstrate relational database operations that could support the IAPO system

Examples:
    
User Story 1: 	As an advisor, I want to view a student's completed and planned courses so that I can track their progress for graduation.

    Purpose: 

    SQL:
SELECT
    s.StudentID,
    s.FirstName,
    s.LastName,
    m.MajorName,
    c.CourseID,
    c.CourseName,
    c.Credits,
    ss.Status,
    sem.SemesterID,
    sem.SemesterTerm,
    sem.Year
FROM Student s
JOIN Major m
    ON s.MajorID = m.MajorID
JOIN Student_Schedule ss
    ON s.StudentID = ss.StudentID
JOIN Courses_Offered co
    ON ss.OfferedID = co.OfferedID
JOIN Course c
    ON co.CourseID = c.CourseID
JOIN Semester sem
    ON co.SemesterID = sem.SemesterID
WHERE s.StudentID = 100005
ORDER BY sem.Year, sem.SemesterTerm;

User Story 2: 	As a student, I want to know which prerequisites I am missing so that I can take them on time.

    Purpose: 

    SQL: 
SELECT
    c.CourseID AS RequiredCourse,
    c.CourseName,
    p.PrereqCourseID AS MissingPrerequisite
FROM Prerequisites p
JOIN Course c
    ON p.CourseID = c.CourseID
WHERE p.CourseID = 'CS624'
AND p.PrereqCourseID NOT IN
(
    SELECT co.CourseID
    FROM Student_Schedule ss
    JOIN Courses_Offered co
        ON ss.OfferedID = co.OfferedID
    WHERE ss.StudentID = 100017
    AND ss.Status = 'Accepted'
);
    
User Story 3: 	As a student, I want to view available courses by semester so that I can plan ahead to graduation on time.
    
    Purpose:

    SQL:
    SELECT
    sem.SemesterID,
    sem.SemesterTerm,
    sem.Year,
    c.CourseID,
    c.CourseName,
    c.Credits,
    co.Instructor,
    co.InstructionalMethod,
    co.MeetingDay,
    co.StartTime,
    co.EndTime,
    co.Capacity,
    co.CurrentlyEnrolled,
    (co.Capacity - co.CurrentlyEnrolled) AS AvailableSeats
FROM Courses_Offered co
JOIN Course c
    ON co.CourseID = c.CourseID
JOIN Semester sem
    ON co.SemesterID = sem.SemesterID
WHERE sem.SemesterID = 'Fall2026'
AND co.CurrentlyEnrolled < co.Capacity
ORDER BY c.CourseID;
    
User Story 4: 	As a department administrator, I want to manage course capacities so that students receive accurate academic plans based on available course seats.

    Purpose: 

    SQL:
SELECT
    co.OfferedID,
    sem.SemesterID,
    c.CourseID,
    c.CourseName,
    co.Capacity,
    co.CurrentlyEnrolled,
    (co.Capacity - co.CurrentlyEnrolled) AS AvailableSeats
FROM Courses_Offered co
JOIN Course c
    ON co.CourseID = c.CourseID
JOIN Semester sem
    ON co.SemesterID = sem.SemesterID
ORDER BY sem.Year, c.CourseID;

    
User Story 5: 	As an advisor, I want to view a student's completed credits and remaining degree requirements, so that I can evaluate their academic progress and provide guidance on course planning for graduation.

    Purpose:

    SQL:
   SELECT
    s.StudentID,
    s.FirstName,
    s.LastName,
    m.MajorName,
    dr.TotalCreditsRequired,
    SUM(c.Credits) AS CompletedCredits,
    (dr.TotalCreditsRequired - SUM(c.Credits)) AS RemainingCredits
FROM Student s
JOIN Major m
    ON s.MajorID = m.MajorID
JOIN Degree_Requirements dr
    ON m.MajorID = dr.MajorID
JOIN Student_Schedule ss
    ON s.StudentID = ss.StudentID
JOIN Courses_Offered co
    ON ss.OfferedID = co.OfferedID
JOIN Course c
    ON co.CourseID = c.CourseID
WHERE s.StudentID = 100001
  AND ss.Status = 'Completed'
GROUP BY
    s.StudentID,
    s.FirstName,
    s.LastName,
    m.MajorName,
    dr.TotalCreditsRequired;
