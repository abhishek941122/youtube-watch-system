import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 bg-rose-500/10 rounded-full text-rose-400 mb-4 border border-rose-500/20">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-5xl font-extrabold text-white tracking-tight">404</h1>
      <h2 className="text-xl font-semibold text-slate-300 mt-2">Page Not Found</h2>
      <p className="text-slate-400 max-w-md mt-2 mb-6">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
