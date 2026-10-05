import React from 'react';
import { Users, Crown, Shield } from 'lucide-react';

export const ParticipantListPlaceholder = () => {
  const dummyParticipants = [
    { id: '1', name: 'Alex (Host)', role: 'host' },
    { id: '2', name: 'Jordan', role: 'moderator' },
    { id: '3', name: 'Taylor', role: 'participant' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
        <Users className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-slate-200">Room Participants</h3>
      </div>
      <div className="mt-4 space-y-3">
        {dummyParticipants.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
            <span className="text-sm font-medium text-slate-300">{user.name}</span>
            {user.role === 'host' && (
              <span className="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md">
                <Crown className="w-3 h-3" />
                <span>Host</span>
              </span>
            )}
            {user.role === 'moderator' && (
              <span className="inline-flex items-center space-x-1 text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md">
                <Shield className="w-3 h-3" />
                <span>Mod</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
