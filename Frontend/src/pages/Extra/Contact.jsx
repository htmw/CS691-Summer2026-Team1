import "./ExtraStyles.css";
import { useState, useRef, useEffect } from "react";
import { useUser } from "../../UserContext";
import emailjs from "@emailjs/browser";

function Contact() {
  const formRef = useRef();
  const [sent, setSent] = useState(null);

  const { loggedIn, userData } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (loggedIn && userData) {
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
      }));
    }
  }, [loggedIn, userData]);

  const handleChange = (e) => {
    setSent(null);

    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setSent(null);

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.message.trim()) {
      setError("Please enter a message.");
      return;
    }

    emailjs
      .sendForm("service_lwfc1d7", "template_k3qrje1", formRef.current, {
        publicKey: "iqTPIxJtwyxBvQ9cP",
      })
      .then(() => {
        setSent("success");

        if (loggedIn) {
          setFormData((prev) => ({
            ...prev,
            message: "",
          }));
        } else {
          setFormData({
            name: "",
            email: "",
            message: "",
          });
        }
      })
      .catch((error) => {
        setSent("error");
        console.error("EmailJS error:", error);
      });
  };

  return (
    <div className="gradientBackground">
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
              encType="text/plain"
              className="contactForm"
            >
              <label className="formLabel">Name</label>
              <input
                className="formInput"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />

              <label className="formLabel">Email</label>
              <input
                className="formInput"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />

              <label className="formLabel">Message</label>
              <textarea
                className="formTextarea contactTextarea"
                name="message"
                placeholder="Tell us how we can help..."
                rows="5"
                value={formData.message}
                onChange={handleChange}
              />

              <button
                type="submit"
                className="heroButton primaryButton contactButton"
              >
                Send Message
              </button>

              {error && <p className="errorMessage">{error}</p>}

              {sent === "success" && (
                <span className="sentMessage">
                  Thank you! Your message has been sent.
                </span>
              )}

              {sent === "error" && (
                <span className="sentMessageError">
                  Failed to send message. Try again.
                </span>
              )}
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Contact;
