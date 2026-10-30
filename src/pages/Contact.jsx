import { useState } from 'react';
import { submitContactMessage } from '../api';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Email regex validation pattern
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validations
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message.');
      return;
    }
    if (message.trim().length < 5) {
      setError('Message must be at least 5 characters long.');
      return;
    }
    if (message.trim().length > 2000) {
      setError('Message cannot exceed 2000 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      setSuccess(res.message || 'Thanks! Your message has been sent successfully. ✅');
      // Clear form only on successful submission
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact">
      <h2>Contact Me</h2>
      <p>Feel free to drop a message below.</p>

      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        {/* Hidden honeypot field for bot/spam prevention */}
        <input
          type="text"
          name="_gotcha"
          style={{ display: 'none' }}
          tabIndex="-1"
          autoComplete="off"
        />

        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. John Doe"
            maxLength={100}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Your Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="e.g. john@example.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">Your Message</label>
          <textarea
            id="message"
            rows="5"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            placeholder="Type your message here..."
            maxLength={2000}
            disabled={loading}
          />
          <p className="char-count">{message.length} / 2000 characters</p>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Sending...' : 'Submit'}
        </button>

        {error && <p className="submit-error">{error}</p>}

        {success && <p className="submit-confirm">{success}</p>}
      </form>

      {message.length > 0 && (
        <p className="live-preview">
          <strong>Preview:</strong> {message}
        </p>
      )}

      <div className="social-links">
        <a
          href="https://www.linkedin.com/in/tanvi-ramani-053b36320?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
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
