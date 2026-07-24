import IAPOBackground from "../assets/IAPOBackground.jpg";
import "./Contact.css";
import { useState, useRef } from "react";
import emailjs from "@emailjs/browser";

function Contact() {
  const formRef = useRef();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      "IAPO",
      "template_dsj3yp5",
      formRef.current,
      "FE2MEaH10ElXALewa"
    )
    .then(() => {
      setSent(true);
      formRef.current.reset();
    })
    .catch((error) => {
      console.error("EmailJS error:", error);
      alert("Failed to send message");
    });
  };

  return (
    <div className="signupContainer">
      <div
        className="signupBackground"
        style={{ backgroundImage: `url(${IAPOBackground})` }}
      >
        <div className="signupCard">
          <p className="formTitle">Contact Us</p>
          <p className="formLabel">Send us an email!</p>

          <form ref={formRef} onSubmit={handleSubmit} className="contactForm">
            <p className="formLabel">Name</p>
            <input
              className="formInput"
              type="text"
              name="user_name"
              placeholder="Your name"
              required
            />

            <p className="formLabel">Email</p>
            <input
              className="formInput"
              type="email"
              name="user_email"
              placeholder="your@email.com"
              required
            />

            <p className="formLabel">Message</p>
            <textarea
              className="formTextarea"
              name="message"
              placeholder="Write your message here..."
              required
            />

            <div className="signupButtonContainer">
              <button type="submit" className="nextButton">
                Send
              </button>
            </div>

            {sent && <p className="sentMessage">Message sent successfully!</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contact;
