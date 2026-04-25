import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { mainLayoutStyles } from '../shared/style';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="content">
        {children}
      </main>
      <Footer />
      
      <style>{mainLayoutStyles}</style>
    </div>
  );
};

export default MainLayout;
