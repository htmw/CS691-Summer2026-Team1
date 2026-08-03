import { RegularLink } from "../../comp/linking.jsx";
import { useEffect, useState } from "react";
import { getReq, postReq } from "../../comp/callRequests.js";
import "./ExtraStyles.css";
import { useUser } from "../../UserContext";

function Home() {

  const {loggedIn} = useUser();

  return (
    <div className="gradientBackground">
      <div className="landingOverlay">
        <section className="heroSection">
          <h1 className="heroTitle">The Intelligent Academic Path Optimizer</h1>

          <p className="heroSubtitle">
            Build the perfect semester schedule with AI. Plan your path to
            graduation in minutes instead of hours.
          </p>

          <div className="heroButtons">
            {!loggedIn ? (
              <>
                <RegularLink
                  href="/signup"
                  className="heroButton primaryButton"
                >
                  Sign Up
                </RegularLink>

                <RegularLink href="/login" className="heroButton primaryButton">
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
              Tell the AI your desired graduation semester, preferred credit
              load, classes you want to take, and any scheduling preferences.
              We'll build a personalized roadmap.
            </p>
          </div>

          <div className="featureCard">
            <div className="featureIcon">📄</div>
            <h2>Upload Your Transcript</h2>
            <p>
              Upload your unofficial transcript so IAPO understands the courses
              you've already completed and generates a more accurate academic
              plan.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
