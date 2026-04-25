import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, Heart, Award } from 'lucide-react';
import '../shared/AboutPage.css';

const AboutPage = () => {
  const fadeInVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Our Story
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Bringing nature's finest right to your doorstep, with a commitment to quality, sustainability, and health.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="container">
          <motion.div
            className="mission-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInVariants}
          >
            <div className="mission-text">
              <h2>Rooted in Nature</h2>
              <p>
                At <strong>NaturaDry</strong>, we believe that the best foods come straight from the earth. Our journey began with a simple idea: to make premium, organic dry fruits and nuts accessible to everyone without compromising on quality or the environment.
              </p>
              <p>
                We partner closely with sustainable farms, ensuring that every almond, walnut, and dried apricot you enjoy is ethically sourced, hand-picked, and naturally processed to retain its nutritional goodness.
              </p>
            </div>
            <div className="mission-image-wrapper">
              <img src="/images/about_mission.png" alt="Sustainability and Nature" className="mission-image" />
              <div className="mission-image-accent"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-values">
        <div className="container">
          <motion.div
            className="values-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInVariants}
          >
            <h2>Our Core Values</h2>
            <p>What drives us every single day to deliver the best for you.</p>
          </motion.div>

          <motion.div
            className="values-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div className="value-card" variants={fadeInVariants}>
              <div className="icon-wrapper">
                <Leaf size={32} />
              </div>
              <h3>100% Organic</h3>
              <p>We say no to synthetic pesticides and chemicals. Pure, unadulterated nature.</p>
            </motion.div>

            <motion.div className="value-card" variants={fadeInVariants}>
              <div className="icon-wrapper">
                <ShieldCheck size={32} />
              </div>
              <h3>Premium Quality</h3>
              <p>Rigorous quality checks ensure you only get the freshest and most flavourful products.</p>
            </motion.div>

            <motion.div className="value-card" variants={fadeInVariants}>
              <div className="icon-wrapper">
                <Heart size={32} />
              </div>
              <h3>Ethical Sourcing</h3>
              <p>Fair trade practices that support farmers and build sustainable communities.</p>
            </motion.div>

            <motion.div className="value-card" variants={fadeInVariants}>
              <div className="icon-wrapper">
                <Award size={32} />
              </div>
              <h3>Customer First</h3>
              <p>Your health and satisfaction are our top priorities. Always.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="about-cta">
        <motion.div
          className="container cta-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInVariants}
        >
          <h2>Experience the NaturaDry Difference</h2>
          <p>Explore our premium selection and take a step towards a healthier lifestyle.</p>
          <a href="/shop" className="btn-primary">Shop Now</a>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
