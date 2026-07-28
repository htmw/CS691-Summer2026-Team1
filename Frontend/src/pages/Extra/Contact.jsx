
import "./ExtraStyles.css";
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
    <div
  className="contactPage"

>
  <div className="landingOverlay">
    <section className="contactSection">
      <div className="contactHeader">
        <h1 className="contactTitle">Get in Touch</h1>
        <p className="contactSubtitle">
          Have a question, found a bug, or have an idea for a new feature?
          We'd love to hear from you.
        </p>
      </div>

      <div className="contactCard">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="contactForm"
        >
          <label className="formLabel">Name</label>
          <input
            className="formInput"
            type="text"
            name="user_name"
            placeholder="John Doe"
            required
          />

          <label className="formLabel">Email</label>
          <input
            className="formInput"
            type="email"
            name="user_email"
            placeholder="john@example.com"
            required
          />

          <label className="formLabel">Message</label>
          <textarea
            className="formTextarea contactTextarea"
            name="message"
            placeholder="Tell us how we can help..."
            required
          />

          <button
            type="submit"
            className="heroButton primaryButton contactButton"
          >
            Send Message
          </button>

          {sent && (
            <p className="sentMessage">
              Thank you! Your message has been sent.
            </p>
          )}
        </form>
      </div>
    </section>
  </div>
</div>
  );
}

export default Contact;
