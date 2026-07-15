import './App.css'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Contact from './pages/Contact.jsx'
import GetStarted from './pages/GetStarted.jsx'
import Transcript from './pages/Transcript.jsx'
import InitChat from './pages/InitChat.jsx'
import ScheduleCreator from './pages/ScheduleCreator.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  const navigate = useNavigate()

  return (   
    <div className="container">
      <div className='navContainer'>
        <p className='navTitle' onClick={() => navigate('/')}>IAPO</p>
        <p className='navOther' onClick={() => navigate('/contact')}>Contact</p>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/getstarted" element={<GetStarted />} />
        <Route path="/transcript" element={<Transcript />} />
        <Route path="/initchat" element={<InitChat />} />
        <Route path="/schedulecreator" element={<ScheduleCreator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes> 
    </div>
  )
}

export default App
