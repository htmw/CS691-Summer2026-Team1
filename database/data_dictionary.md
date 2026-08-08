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

### CSV File Description

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



### Student Schedule:
- Draft - A schedule has been created but not finalized
- Optimized - AI/optimization engine created a schedule that satisfies the student's constraints
- Accepted -Student/advisor accepted the schedule
- Modified - Student or advisor changed the generated schedule
- Conflict - The schedule has problems (time conflicts, missing prerequisites, etc.)
- Completed – course has been taken and completed.

### Student Constraints

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


### Constraints Priority:
- 1 - required/a must
- 2 - very important
- 3 - preference
- 4 - not mandatory but would like to.
