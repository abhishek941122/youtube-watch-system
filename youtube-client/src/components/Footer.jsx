import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900/80 py-6 sm:py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 space-y-1.5 leading-relaxed">
        <p className="font-medium text-slate-400">
          YouTube Watch Party &copy; {new Date().getFullYear()} — Real-Time Video Synchronization System
        </p>
        <p className="text-slate-600">Built with React, Socket.IO, Node.js, Express & MongoDB</p>
      </div>
    </footer>
  );
};

export default Footer;
