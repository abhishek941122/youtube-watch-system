import React from 'react';
import Card from './Card.jsx';
import Loader from './Loader.jsx';
import { Play, Users, Tv } from 'lucide-react';

export const PlayerSkeleton = () => {
  return (
    <div className="w-full aspect-video bg-slate-900/80 border border-slate-800/90 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden shadow-2xl animate-pulse">
      {/* Decorative Glow Background */}
      <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
          <Play className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 ml-1 fill-slate-700" />
        </div>
        <Loader size="sm" />
        <p className="text-xs sm:text-sm font-semibold text-slate-400 tracking-wide mt-2">
          Loading YouTube Player...
        </p>
      </div>
    </div>
  );
};

export const RoomHeaderSkeleton = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800/90 backdrop-blur-xl shadow-2xl animate-pulse">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="w-20 h-6 bg-slate-800/80 rounded-full" />
          <div className="w-28 sm:w-36 h-8 bg-slate-800/80 rounded-xl" />
          <div className="w-24 h-6 bg-slate-800/80 rounded-full" />
        </div>
        <div className="w-56 sm:w-72 h-3 bg-slate-800/60 rounded-md" />
      </div>
      <div className="w-full sm:w-32 h-9 bg-slate-800/80 rounded-xl self-stretch sm:self-auto shrink-0" />
    </div>
  );
};

export const ParticipantListSkeleton = () => {
  return (
    <Card
      title="Participants"
      headerAction={<Users className="w-5 h-5 text-indigo-400/50" />}
    >
      <div className="space-y-3.5 animate-pulse">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="p-4 rounded-2xl border border-slate-800/90 bg-slate-900/70 space-y-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="w-28 sm:w-36 h-4 bg-slate-800/80 rounded-md" />
                <div className="w-20 h-3 bg-slate-800/60 rounded-md" />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex gap-2 w-full">
              <div className="h-9 bg-slate-800/70 rounded-xl flex-1" />
              <div className="h-9 bg-slate-800/70 rounded-xl flex-1" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const NowPlayingSkeleton = () => {
  return (
    <Card
      title="Now Playing"
      subtitle="Current playback session status and video details"
      headerAction={<Tv className="w-5 h-5 text-indigo-400/50" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 animate-pulse">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="w-16 h-3 bg-slate-800/60 rounded" />
          <div className="w-24 h-4 bg-slate-800/80 rounded" />
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="w-24 h-3 bg-slate-800/60 rounded" />
          <div className="w-28 h-5 bg-slate-800/80 rounded-full" />
        </div>
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="w-16 h-3 bg-slate-800/60 rounded" />
          <div className="w-20 h-5 bg-slate-800/80 rounded-full" />
        </div>
      </div>
    </Card>
  );
};

export default {
  PlayerSkeleton,
  RoomHeaderSkeleton,
  ParticipantListSkeleton,
  NowPlayingSkeleton,
};
