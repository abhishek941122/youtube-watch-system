import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-hidden animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
