import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import '../shared/contactpage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call for form submission
    setTimeout(() => {
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 1000);
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-overlay"></div>
        <div className="contact-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            We'd love to hear from you. Whether you have a question about our products, sourcing, or just want to say hello, we're here.
          </motion.p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="contact-content container">
        <div className="contact-grid">

          {/* Contact Information */}
          <motion.div
            className="contact-info"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInVariants} className="info-header">
              <h2>Contact Information</h2>
              <p>Reach out to us directly through any of the channels below.</p>
            </motion.div>

            <div className="info-cards">
              <motion.div variants={fadeInVariants} className="info-card">
                <div className="icon-circle">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3>Our Store</h3>
                  <p>123 Nature's Avenue,<br />Greenwich District, NY 10001</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInVariants} className="info-card">
                <div className="icon-circle">
                  <Phone size={24} />
                </div>
                <div>
                  <h3>Call Us</h3>
                  <p>+1 (555) 123-4567<br />Mon-Fri: 9am - 6pm EST</p>
                </div>
              </motion.div>

              <motion.div variants={fadeInVariants} className="info-card">
                <div className="icon-circle">
                  <Mail size={24} />
                </div>
                <div>
                  <h3>Email Us</h3>
                  <p>support@naturadry.com<br />hello@naturadry.com</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="contact-form-container"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            <div className="form-header">
              <h2>Send a Message</h2>
              <p>Fill out the form below and we will get back to you within 24 hours.</p>
            </div>

            {isSubmitted && (
              <div className="success-message">
                <p>Thank you! Your message has been successfully sent.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="your name  Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your name @example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Write your message here..."
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                <Send size={18} className="btn-icon" /> Send Message
              </button>
            </form>
          </motion.div>

        </div>
      </section>
    </div>
  );
};

export default ContactPage;
