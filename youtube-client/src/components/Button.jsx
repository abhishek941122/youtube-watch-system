import React from 'react';

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30 hover:shadow-indigo-500/35 hover:border-indigo-400/50',
    secondary:
      'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 shadow-md hover:border-slate-600 hover:text-white',
    outline:
      'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:text-white shadow-sm hover:border-indigo-400/60',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/25 border border-rose-500/30 hover:shadow-rose-500/35 hover:border-rose-400/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-4 py-2.5 text-sm font-semibold',
    lg: 'px-6 py-3.5 text-base font-bold',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
