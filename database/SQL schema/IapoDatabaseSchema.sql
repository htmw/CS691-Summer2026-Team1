/* AI was used as an proof reader for the draft SQL, to assist in delete/add/relocate/order of any table/row */

/* Foundation layer for academic information/data */
CREATE TABLE Department (   /* ex: Seidenberg School of Computer Science & Information Technology */
  DepartmentID INT NOT NULL,
  DepartmentName VARCHAR(100) NOT NULL,
  PRIMARY KEY (DepartmentID)
  );
CREATE TABLE Major ( /* ex: Computer Science */
  MajorID INT NOT NULL,
  MajorName VARCHAR(100) NOT NULL,
  DepartmentID INT NOT NULL, /* suggested to add for connection */
  PRIMARY KEY (MajorID),
  FOREIGN KEY (DepartmentID) REFERENCES Department(DepartmentID)
  );
CREATE TABLE Semester ( /* ex: Fall 2025 */
  SemesterID INT NOT NULL,
  SemesterTerm VARCHAR(15) NOT NULL,
  Year INT NOT NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  PRIMARY KEY (SemesterID)
);
CREATE TABLE Degree_Requirements ( /* each majors requirement for graduation */
    RequirementID INT NOT NULL,
    MajorID INT NOT NULL,
    TotalCreditsRequired INT NOT NULL,
    CoreCreditsRequired INT NOT NULL,
    ElectiveCreditsRequired INT NOT NULL,
    CapstoneCreditsRequired INT NOT NULL,
    MinimumGPA DECIMAL(3,2), /* 3 total digits allowed, 2 digits after decimal point, 1 digit before decimal point */
    PRIMARY KEY (RequirementID),
    FOREIGN KEY (MajorID) REFERENCES Major(MajorID)
    CHECK (CapstoneCreditsRequired IN (3,4))
);

/* Student and Course data */
CREATE TABLE Student (
  StudentID INT NOT NULL,
  FirstName VARCHAR(30) NOT NULL,
  LastName VARCHAR(50) NOT NULL,
  Email VARCHAR(100) NOT NULL,
  Degree VARCHAR(50) NOT NULL,
  MajorID INT NOT NULL,
  PRIMARY KEY (StudentID),
  FOREIGN KEY (MajorID) REFERENCES Major(MajorID)
);
CREATE TABLE Course (
  CourseID INT NOT NULL,
  CourseName VARCHAR(100) NOT NULL,
  Credits INT NOT NULL,
  CourseKeywords TEXT NOT NULL, /* suggested add for AI communication */
  CareerTags TEXT NOT NULL, /* suggested add for AI communication */
  PRIMARY KEY (CourseID),
  CHECK (Credits > 0 AND Credits <= 6) /* Constraint: to ensure valid credit hour values for courses */
);


/* Defining relationships and constraints between academic entities */
CREATE TABLE Major_Course ( /* suggested to add table just incase a course can be used across multiple majors */
  MajorID INT NOT NULL,
  CourseID INT NOT NULL,
  RequirementType VARCHAR(50) NOT NULL, /* Core, Elective, Capstone */ /* suggested add to distinguish where the course fits in the degree */
  PRIMARY KEY (MajorID, CourseID),
  FOREIGN KEY (MajorID) REFERENCES Major(MajorID),
  FOREIGN KEY (CourseID) REFERENCES Course(CourseID)
);

CREATE TABLE Prerequisites (
  CourseID INT NOT NULL, /* the course that requires a prerequisite */
  PrereqCourseID INT NOT NULL, /* the prerequisite course that have to be taken first */
  PRIMARY KEY (CourseID, PrereqCourseID),
  FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
  FOREIGN KEY (PrereqCourseID) REFERENCES Course(CourseID), /* has to exist in Course, separate check - same table */
  CHECK (CourseID <> PrereqCourseID) /* Constraint: to prevent a course from being its own prerequisite */
);

/* AI and Optimization Engine layer */ 
/* used AI to know specifically what attributes to add for a successful run */ 
CREATE TABLE Courses_Offered  ( 
  OfferedID INT NOT NULL, 
  CourseID INT NOT NULL,
  SectionID INT NOT NULL,
  SemesterID INT NOT NULL,
  /* suggested to relocate from Course > Courses_Offered (from Instructor to EndTime) */
  Instructor VARCHAR (100) NOT NULL,
  InstructionalMethod VARCHAR(15) NOT NULL, /* online, hybrid, or in person */
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  MeetingDay VARCHAR(30) NOT NULL,
  StartTime TIME  NOT NULL,
  EndTime TIME  NOT NULL,
  Capacity INT NOT NULL,
  CurrentlyEnrolled INT DEFAULT 0, /* default added to automatically add a value of 0 */
  PRIMARY KEY (OfferedID),
  FOREIGN KEY (CourseID) REFERENCES Course(CourseID),
  FOREIGN KEY (SemesterID) REFERENCES Semester(SemesterID),
  CHECK (EndDate > StartDate), /* recommended to add for data validation */
  CHECK (Capacity > 0),
  CHECK (CurrentlyEnrolled >= 0 AND CurrentlyEnrolled <= Capacity) /* recommended add to start at 0 & prevent over capacity */
);
CREATE TABLE Student_Constraints  ( /* stores each students individual scheduling preferences and restrictions */
  ConstraintID INT NOT NULL,
  StudentID INT NOT NULL,
  ConstraintType VARCHAR(50) NOT NULL, /* ex: RequiredDaysOff, MaxCreditsPerSemester, WorkScheduleConflict */
  ConstraintValue VARCHAR(100) NOT NULL, /* value for that constraint, for ex: Wed/Fri 7am-12pm, 12/15(credits), true/false, Dr.Dan */
  Priority INT, /* classify how important the constraint is, if a student has multiple */
  PRIMARY KEY (ConstraintID),
  FOREIGN KEY (StudentID) REFERENCES Student(StudentID)
);
CREATE TABLE Student_Schedule  ( 
  ScheduleID INT NOT NULL,
  StudentID INT NOT NULL,
  OfferedID INT NOT NULL, 
  Status VARCHAR(50) NOT NULL,
  PRIMARY KEY (ScheduleID),
  FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
  FOREIGN KEY (OfferedID) REFERENCES Courses_Offered(OfferedID)
);