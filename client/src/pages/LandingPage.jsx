import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../components/ui';

import * as productsApi from '../api/products';

const LandingPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await productsApi.getCategories();
        if (res.success) {
          setCategories(res.data?.categories || []);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const features = [
    { icon: <ShieldCheck size={32} />, title: '100% Organic', desc: 'Purely natural products without preservatives.' },
    { icon: <Truck size={32} />, title: 'Fast Delivery', desc: 'Express shipping within 24-48 hours.' },
    { icon: <RefreshCcw size={32} />, title: 'Easy Returns', desc: 'Hassle-free 30-day return policy.' },
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Nature's Goodness <br /><span>Delivered Dry</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Premium selection of organic dried fruits, nuts, and herbs.
            Sustainable snacking for a healthier lifestyle.
          </motion.p>
          <motion.div
            className="hero-btns flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button as={Link} to="/shop" variant="primary" size="lg" icon={ArrowRight}>
              Shop Now
            </Button>
            <Button as={Link} to="/about" variant="admin-outline" size="lg" className="border-white text-white hover:bg-white/10">
              Our Story
            </Button>
          </motion.div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



    </div>
  );
};

export default LandingPage;
