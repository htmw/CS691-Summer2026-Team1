import IAPOBackground from "/assets/IAPOBackground.jpg";
import { RegularLink } from "../../comp/linking.jsx";
import { useEffect, useState } from "react";
import { getReq, postReq } from "../../comp/callRequests.js";
import "./ExtraStyles.css";

function Home() {
  // const [apiData, setApiData] = useState(null);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const data = await getReq("/get-data");
  //       setApiData(data);
  //       console.log("GET response:", data);
  //     } catch (error) {
  //       console.error("GET request failed:", error);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // const handlePostRequest = async () => {
  //   try {
  //     const response = await postReq("/post-data", {
  //       name: "Test Hello",
  //       value: 10,
  //     });

  //     console.log("POST response:", response);
  //     setApiData(response);
  //   } catch (error) {
  //     console.error("POST request failed:", error);
  //   }
  // };

  return (
<div className="background">
  <div className="landingOverlay">
    <section className="heroSection">
      <h1 className="heroTitle">
        The Intelligent Academic Path Optimizer
      </h1>

      <p className="heroSubtitle">
        Build the perfect semester schedule with AI. Plan your path to
        graduation in minutes instead of hours.
      </p>

      <div className="heroButtons">
        {!false ? (
          <>
            <RegularLink href="/signup" className="heroButton primaryButton">
              Sign Up
            </RegularLink>

            <RegularLink href="/login" className="heroButton secondaryButton">
              Log In
            </RegularLink>
          </>
        ) : (
          <button className="heroButton primaryButton">
            Generate Schedule
          </button>
        )}
      </div>
    </section>

    <section className="featuresSection">
      <div className="featureCard">
        <div className="featureIcon">🎓</div>
        <h2>AI Schedule Generator</h2>
        <p>
          Generate optimized semester schedules for Pace University based on
          degree requirements, prerequisites, and your academic goals.
        </p>
      </div>

      <div className="featureCard">
        <div className="featureIcon">🤖</div>
        <h2>Personalized Planning</h2>
        <p>
          Tell the AI your desired graduation semester, preferred credit load,
          classes you want to take, and any scheduling preferences. We'll build
          a personalized roadmap.
        </p>
      </div>

      <div className="featureCard">
        <div className="featureIcon">📄</div>
        <h2>Upload Your Transcript</h2>
        <p>
          Upload your unofficial transcript so IAPO understands the courses
          you've already completed and generates a more accurate academic plan.
        </p>
      </div>
    </section>
  </div>
</div>

  );
}

export default Home;
