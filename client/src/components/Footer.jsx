import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Camera, MessageSquare, Mail, Phone, MapPin, Leaf } from 'lucide-react';


const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <Leaf className="logo-icon" />
              <span>NaturaDry</span>
            </Link>
            <p className="footer-desc">
              Premium natural dried products delivered with care to your doorstep. Eco-friendly, sustainable, and purely natural.
            </p>
            <div className="social-links">
              <a href="#"><Globe size={20} /></a>
              <a href="#">< Camera size={20} /></a>
              <a href="#"><MessageSquare size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="footer-links">
            <h3>Categories</h3>
            <ul>
              <li><Link to="/shop?cat=fruits">Dried Fruits</Link></li>
              <li><Link to="/shop?cat=nuts">Premium Nuts</Link></li>
              <li><Link to="/shop?cat=herbs">Natural Herbs</Link></li>
              <li><Link to="/shop?cat=snacks">Healthy Snacks</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h3>Contact Us</h3>
            <div className="contact-item">
              <MapPin size={18} />
              <span>Hunza Pakistan</span>
            </div>
            <div className="contact-item">
              <Phone size={18} />
              <span>+92 3154125780</span>
            </div>
            <div className="contact-item">
              <Mail size={18} />
              <span>inamkarim96@gmail.com</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} NaturaDry. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>


    </footer>
  );
};

export default Footer;
