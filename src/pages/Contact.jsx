import { useState } from 'react';

function Contact() {
  // useState variable #2: controlled input for the message field
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (message.trim() === '') return;
    setSubmitted(true);
    setMessage('');
  }

  return (
    <section className="contact">
      <h2>Contact Me</h2>
      <p>Feel free to drop a message below.</p>

      <label htmlFor="message">Your Message</label>
      <textarea
        id="message"
        rows="5"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setSubmitted(false);
        }}
        placeholder="Type your message here..."
      />

      <p className="char-count">{message.length} characters</p>

      <button className="submit-btn" onClick={handleSubmit}>
        Submit
      </button>

      {submitted && (
        <p className="submit-confirm">
          Thanks! Your message has been noted. ✅
        </p>
      )}

      {message.length > 0 && (
        <p className="live-preview">
          <strong>Preview:</strong> {message}
        </p>
      )}

      <div className="social-links">
        
         <a href="https://www.linkedin.com/in/tanvi-ramani-053b36320?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
          target="_blank"
          rel="noopener noreferrer"
          className="linkedin-link"
        >
          Connect with me on LinkedIn
        </a>
      </div>
    </section>
  );
}

export default Contact;