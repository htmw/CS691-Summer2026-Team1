# DynamoDB Access Patterns

The access patterns are used to identify the data the system needs to retrieve and the DynamoDB tables/keys used to support those requests.

**User Story 1:**
As an advisor, I want to view a student's completed and planned courses so that I can track their progress for graduation.

Access Pattern:
- Look up the student's course records
- Pull the actual course and semester details for each one
- Return course info, semester, and status (completed/planned)

**User Story 2:**
As a student, I want to know which prerequisites I am missing so that I can take them on time.

Access Pattern:
- Get the required prerequisites for the course
- Get the student's completed courses
- Compare the two lists
- Return whatever prerequisites are missing

**User Story 3:**
As a student, I want to view available courses by semester so that I can plan ahead to graduation on time.

Access Pattern:
- Pull all course sections offered that semester
- Filter out the ones that are full
- Attach course details
- Return what's left with seat availability

**User Story 4:**
As a department administrator, I want to manage course capacities so that students receive accurate academic plans based on available course seats.

Access Pattern:
- Look up a course section directly
- Check its seats
- Update the enrollment count when needed

**User Story 5:**
As an advisor, I want to view a student's completed credits and remaining degree requirements so that I can evaluate their academic progress.

Access Pattern:
- Pull the student's completed courses and credits
- Pull the degree requirements for their major
- Compare the two to show what's done and what's left
