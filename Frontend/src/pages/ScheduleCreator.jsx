import './ScheduleCreator.css'
import { useState } from 'react'
import IAPOBackground from '../assets/IAPOBackground.jpg'
import { useUser } from '../UserContext'


const semesters = [
  'Fall 2024', 'Spring 2025', 'Fall 2025',
  'Spring 2026', 'Fall 2026', 'Spring 2027', 'Fall 2027', 'Spring 2028'
]

function ScheduleCreator() {
  const [degreeLevel, setDegreeLevel] = useState('Undergrad')
  const [startingSemester, setStartingSemester] = useState('Fall 2027')
  const [endingSemester, setEndingSemester] = useState('Spring 2027')
  const [credits, setCredits] = useState('12')
  const [ask, setAsk] = useState('')
  const [activeYear, setActiveYear] = useState('2027')
  const { userData } = useUser()
  

  const schedule = [
    {
      semester: 'Fall 2026',
      courses: ['ENG 101 - English Composition', 'PHIL 200 - Ethics', 'CS 150 - Web Development', 'MATH 201 - Calculus I']
    },
    {
      semester: 'Spring 2027',
      courses: ['CS 101 - Intro to a Computer', 'Lit 123 - Shakespearean Shakespeare', 'Math 303 - Algebra 16', 'CS 200 - Data/Data']
    },
    {
      semester: 'Fall 2027',
      courses: ['CS 301 - Algorithms', 'MATH 400 - Linear Algebra', 'CS 350 - Operating Systems', 'PHYS 101 - Physics I']
    },
    {
      semester: 'Spring 2028',
      courses: ['CS 400 - Machine Learning', 'CS 410 - Databases', 'MATH 450 - Statistics', 'CS 490 - Senior Project']
    },
    {
      semester: 'Fall 2028',
      courses: ['CS 499 - Capstone', 'BUS 300 - Entrepreneurship', 'CS 420 - Security', 'COMM 200 - Public Speaking']
    }
  ]

  // Get unique years from the schedule
  const years = [...new Set(schedule.map((sem) => sem.semester.split(' ')[1]))]

  // Filter semesters by active year tab
  const filteredSchedule = schedule.filter((sem) => sem.semester.includes(activeYear))

  return (
    <div className="schedulePageContainer" style={{ backgroundImage: `url(${IAPOBackground})` }}>
      <div className="profilePanel">
        <p className="profileTitle">{userData.name}'s Profile</p>

        <p className="profileLabel">Degree Level</p>
        <div className="toggleContainer">
          <p
            className={`toggleOption ${degreeLevel === 'Undergrad' ? 'toggleActive' : ''}`}
            onClick={() => setDegreeLevel('Undergrad')}
          >
            Undergrad
          </p>
          <p
            className={`toggleOption ${degreeLevel === 'Graduate' ? 'toggleActive' : ''}`}
            onClick={() => setDegreeLevel('Graduate')}
          >
            Graduate
          </p>
        </div>

        <p className="profileLabel">Starting Semester</p>
        <select
          className="profileSelect"
          value={startingSemester}
          onChange={(e) => setStartingSemester(e.target.value)}
        >
          {semesters.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <p className="profileLabel">Ending Semester</p>
        <select
          className="profileSelect"
          value={endingSemester}
          onChange={(e) => setEndingSemester(e.target.value)}
        >
          {semesters.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <p className="profileLabel">Credits</p>
        <input
          className="profileInput"
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
        />

        <div className="profileDivider"></div>

        <p className="profileLabel">Ask for something else</p>
        <textarea
          className="profileTextarea"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="i.e. put more focus on math"
        />

        <div className="profileNextContainer">
          <p className="nextButton">Next</p>
        </div>
      </div>

      <div className="schedulePanel">
        <p className="scheduleTitle">{userData.name}'s Schedule</p>
        <div className="yearTabs">
          {years.map((year) => (
            <p
              key={year}
              className={`yearTab ${activeYear === year ? 'yearTabActive' : ''}`}
              onClick={() => setActiveYear(year)}
            >
              {year}
            </p>
          ))}
        </div>
        <div className="semesterList">
          {filteredSchedule.map((sem) => (
            <div className="semesterCard" key={sem.semester}>
              <p className="semesterName">{sem.semester}</p>
              {sem.courses.map((course, i) => (
                <p className="courseName" key={i}>{course}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScheduleCreator
