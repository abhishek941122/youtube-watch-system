import React from 'react';

export const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 bg-slate-950/80 border border-slate-800/90 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/15 shadow-inner transition-all duration-200 ease-out ${
          error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
