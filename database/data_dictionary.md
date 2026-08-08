# Data Dictionary

### Database Repository Structure

The database branch contains the SQL and NoSQL database implementations, supporting documentation, and data representations.

```text
database/
├── SQL Schema/
│   ├── CurrentData.sql
|   ├── ER Diagram.png
│   ├── IapoDatabaseSchema.sql
│   ├── testing_queries.sql
│   └── ReadME.md
│
├── NoSQL DynamoDB/
│   ├── Exported.items/
│   │   ├── courses.csv
│   │   ├── courses offered.csv
│   │   ├── constraints.csv
│   │   ├── degree requirements.csv
│   │   ├── department.csv
│   │   ├── major course.csv
│   │   ├── majors.csv
│   │   ├── prerequisites.csv
│   │   ├── schedule.csv
│   │   ├── semesters.csv
│   │   ├── students.csv
│   │   └── ReadME.md
│   ├── sample_items.json
│   ├── Tables.json
│   ├── Access_Pattern.md
│   ├── Dynamodb Model.png
│   └── ReadME.md
│
├── data_dictionary.md
├── database_design_decisions.md
├── IAPO UserStories.pdf
└── README.md
```

### Directory File Descriptions

SQL Schema:
- CurrentData.sql - Contains the current SQL data to fill each entity for testing.
- ER Diagram.png - Visual representation of the SQL database entities and their relationships.
- IapoDatabaseSchema.sql - Contains the SQL database schema, including tables, columns, keys, and constraints.
- testing_queries.sql - Contains SQL queries used to test and validate the database.
- README.md - Provides an overview of the SQL files.

NoSQL DynamoDB:
- Exported.items - Contains CSV representations of the data stored in the DynamoDB tables.
- sample_items.json - Contains representative examples of DynamoDB items and their attributes.
- Tables.json - The structure and attributes of the DynamoDB tables.
- Access_Pattern.md - Documents how the application is expected to access and retrieve data from DynamoDB.
- Dynamodb Model.png - Visual representation of the DynamoDB data model.
- README.md - Provides an overview of the DynamoDB files.

Other Documents:
- data_dictionary.md - Defines database attributes, data types, fixed values, relationships, and terminology.
- database_design_decisions.md - Documents important database design decisions and the reasoning behind them.
- IAPO UserStories.pdf - Contains the user stories that define the application's database and scheduling requirements.
- README.md - Provides an overview of the database branch and its contents.

### Database Table/CSV File Description
- Courses (courses.csv) - Stores information about available courses
- Courses Offered (courses offered.csv) - Stores course sections offered during a semester.
- Constraints (constraints.csv) - Stores student scheduling preferences and restrictions.
- Degree Requirements(degree requirements.csv) - Stores degree requirements for each major.
- Department(department.csv) - School department information.
- Major Course (major course.csv) - Associates courses with majors.
- Majors (majors.csv) - Stores information about department majors.
- Prerequisites (prerequisites.csv) - Stores prerequisite relationships between courses.
- Schedule (schedule.csv) - Stores student schedules and schedule information.
- Semesters (semesters.csv) - Stores semester information.
- Students (students.csv) - Stores student information.

### Data Type:
SQL
- PRIMARY KEY
- FOREIGN KEY
- INT - Integer
- DATE - Date
- VARCHAR - variable length string
- DECIMAL - An exact fixed point number
- TEXT - Large amount of data

NoSQL
- PK - Primary Key
- S - String
- N - Number
- SS - String Set

### Key Relationships
The relationships describe the logical connections between the entities represented in the database.

| Entity 1 | ID | Relationship | Entity 2 | Description |
|---|---|---|---|---|
| Student | StudentID | has | Constraints | A student can have multiple scheduling constraints. |
| Student | StudentID | has | Schedule | A student can have multiple schedules. |
| Student | MajorID | belongs to | Major | A student is associated with an academic major. |
| Major | MajorID | belongs to | Department | A major is associated with a department. |
| Major | MajorID | has | Major Course | A major can be associated with multiple courses. |
| Course | CourseID | has | Prerequisites | A course may have one or more prerequisite courses. |
| Course | CourseID | has | Courses Offered | A course can have multiple offers. |
| Semester | SemesterID | contains | Courses Offered | A semester can contain multiple course offerings. |
| Course | CourseID | satisfies | Degree Requirements | A course can satisfy a degree requirement. |
| Schedule | ScheduleID | contains | Courses Offered | A schedule contains selected course offerings. |

## Table Fixed Values

These are predefined values used by the database to maintain consistent entries.

### Instructional Method
- Online
- In Person
- Hybrid

### Course Requirement Type
- Bridge (not mandatory, unless)
- Core
- Elective
- Capstone

### Student Schedule:
- Draft - A schedule has been created but not finalized
- Optimized - AI/optimization engine created a schedule that satisfies the student's constraints
- Accepted -Student/advisor accepted the schedule
- Modified - Student or advisor changed the generated schedule
- Conflict - The schedule has problems (time conflicts, missing prerequisites, etc.)
- Completed – course has been taken and completed.

### Constraints Priority:
- 1 - required/a must
- 2 - very important
- 3 - preference
- 4 - not mandatory but would like to.

## Student Constraints

Stores individual student scheduling preferences and restrictions used when creating an academic schedule.

| ConstraintType | ConstraintValue (Ex) | Example Meaning |
|----------------|---------------------------|-----------------|
| RequiredDaysOff | Friday | Student cannot have classes on Friday |
| PreferredDays | Monday,Wednesday | Student prefers classes on these days |
| AvoidDays | Tuesday | Student does not want classes on Tuesday |
| PreferredTime | Morning | Student prefers morning classes |
| AvoidTime | 5PM-8PM | Student cannot take classes during this time |
| MaxCredits | 9 | Student wants a maximum of 9 credits |
| MinCredits | 6 | Student wants at least 6 credits |
| PreferredInstructionalMethod | Online | Student prefers online courses |
| AvoidInstructionalMethod | In Person | Student does not want in person courses |
| GraduationDeadline | Spring 2027 | Schedule must meet Graduation goal |
| NoScheduleConflict | True | Courses cannot overlap |
| AvoidInstructor | Dr.Yung | Student does not want to take any class by Instructor |
| BreakTime | 1 Hour | Student wants at least an hour break in-between classes |

