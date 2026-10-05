import React from 'react';

export const Card = ({ children, title, subtitle, className = '', headerAction }) => {
  return (
    <div
      className={`bg-slate-900/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-950/40 transition-all duration-300 ease-out hover:border-slate-700/80 hover:shadow-2xl hover:shadow-indigo-950/20 ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="mb-5 flex items-start justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            {title && (
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
