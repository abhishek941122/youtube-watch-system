import React from 'react';

export const Loader = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 space-y-3">
      <div
        className={`${sizes[size] || sizes.md} border-indigo-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p className="text-sm font-medium text-slate-400">{text}</p>}
    </div>
  );
};

export default Loader;
