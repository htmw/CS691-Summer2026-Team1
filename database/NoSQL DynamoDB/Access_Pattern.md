# DynamoDB Access Patterns

The access patterns are used to identify the data the system needs to retrieve and the DynamoDB tables/keys used to support those requests.

**User Story 1:**
As an advisor, I want to view a student's completed and planned courses so that I can track their progress for graduation.

Access Pattern:
- Retrieve all courses associated with a specific student.
- Query the StudentSchedule table using StudentID.
- Return course information, semester information, and course status (Completed or Planned).

**User Story 2:**
As a student, I want to know which prerequisites I am missing so that I can take them on time.

Access Pattern:
- Retrieve prerequisites required for a selected course.
- Retrieve the student's completed courses.
- Compare completed courses with required prerequisites, one at a time.
- Return any missing prerequisite courses.

**User Story 3:**
As a student, I want to view available courses by semester so that I can plan ahead to graduation on time.

Access Pattern:
- Retrieve courses offered during a selected semester.
- Filter courses based on available seats.
- Return course details, schedule information, and enrollment availability.

**User Story 4:**
As a department administrator, I want to manage course capacities so that students receive accurate academic plans based on available course seats.

Access Pattern:
- Retrieve course enrollment and capacity information.
- Identify courses with available seats or courses that are full.
- Return capacity and enrollment details.
- Ability to update enrollment count on Courses_Offered 

**User Story 5:**
As an advisor, I want to view a student's completed credits and remaining degree requirements so that I can evaluate their academic progress.

Access Pattern:
- Retrieve completed courses for a student.
- Retrieve degree requirements for the student's major.
- Calculate completed and remaining credits toward graduation.
