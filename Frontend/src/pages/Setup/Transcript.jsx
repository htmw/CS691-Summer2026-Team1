import IAPOBackground from '../assets/IAPOBackground.jpg'
import fileimg from '../assets/file.png'
import './Transcript.css'
import { useNavigate } from 'react-router-dom'

function Transcript() {
  const navigate = useNavigate()

  return (
    <div className="getStartedContainer">
      <div className="getStartedBackground" style={{ backgroundImage: `url(${IAPOBackground})` }}>
        <div className="formCardCenter">
          <p className="formTitle">Upload an optional transcript</p>
          <div className="transcriptContainer">
            <img src={fileimg} alt="file pic" className="fileimg" />
            <p className="uploadText">Click to upload your files</p>
          </div>
          <div className="nextButtonContainer">
            <p className="nextButton" onClick={() => navigate('/initchat')}>Next</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Transcript
