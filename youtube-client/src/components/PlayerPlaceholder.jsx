import React from 'react';
import { Play, Sparkles } from 'lucide-react';

export const PlayerPlaceholder = () => {
  return (
    <div className="w-full aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/40 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden group">
      {/* Decorative Glow Background */}
      <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full group-hover:bg-indigo-600/10 transition-all duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-md">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-300">
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-indigo-400/30 ml-1 text-indigo-400" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          No Video Loaded
        </h3>

        <p className="text-sm sm:text-base text-slate-400 mt-2 font-medium leading-relaxed">
          Paste a YouTube URL above to start watching together.
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-indigo-300 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Only Host and Moderator can load videos.</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerPlaceholder;
