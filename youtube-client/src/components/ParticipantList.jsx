import React, { useState } from 'react';
import Card from './Card.jsx';
import Button from './Button.jsx';
import { Users, Crown, ShieldCheck, User, UserPlus, UserMinus, Trash2, ArrowRightLeft, AlertCircle } from 'lucide-react';
import socket from '../services/socketService.js';

export const ParticipantList = ({ roomId, participants = [], localUsername = '' }) => {
  const [targetToTransfer, setTargetToTransfer] = useState(null);

  const currentParticipant = participants.find(
    (p) => p.username?.toLowerCase() === localUsername?.toLowerCase()
  );
  const isCurrentHost = currentParticipant?.role === 'Host';

  const handleAssignRole = (targetUsername, role) => {
    socket.emit('assign-role', {
      roomId,
      targetUsername,
      role,
      username: localUsername,
    });
  };

  const handleRemoveParticipant = (targetUsername) => {
    socket.emit('remove-participant', {
      roomId,
      targetUsername,
      username: localUsername,
    });
  };

  const handleConfirmTransferHost = () => {
    if (!targetToTransfer) return;
    socket.emit('transfer-host', {
      roomId,
      targetUsername: targetToTransfer,
      username: localUsername,
    });
    setTargetToTransfer(null);
  };

  return (
    <>
      <Card
        title={`Participants (${participants.length})`}
        headerAction={<Users className="w-5 h-5 text-indigo-400" />}
      >
        {participants.length === 0 ? (
          <div className="text-center py-8 px-4 space-y-2.5 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800/80">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">Waiting for Participants</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Invite others using the room code.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[650px] overflow-y-auto custom-scrollbar pr-1">
            {participants.map((participant, index) => {
              const role = participant.role || 'Participant';
              const isHost = role === 'Host';
              const isModerator = role === 'Moderator';
              const isParticipant = role === 'Participant';
              const isCurrentUser =
                participant.username?.toLowerCase() === localUsername?.toLowerCase();

              let cardStyle =
                'p-4 rounded-2xl border transition-all duration-200 ease-out focus-within:ring-2 focus-within:ring-indigo-500/40 ';

              if (isHost) {
                cardStyle +=
                  'bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:border-amber-500/60 hover:-translate-y-0.5';
              } else if (isModerator) {
                cardStyle +=
                  'bg-gradient-to-r from-blue-950/25 via-slate-900/90 to-slate-900/90 border-blue-500/35 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-500/60 hover:-translate-y-0.5';
              } else {
                cardStyle +=
                  'bg-slate-900/70 border-slate-800/90 hover:bg-slate-800/80 hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5';
              }

              if (isCurrentUser) {
                cardStyle += ' ring-1 ring-indigo-500/40';
              }

              return (
                <div
                  key={participant.socketId || participant.username || index}
                  className={cardStyle}
                >
                  {/* TOP SECTION: User Avatar, Name & Role Badge */}
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg shadow-md shrink-0 transition-transform duration-200 hover:scale-105 select-none ${
                        isHost
                          ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-500/40'
                          : isModerator
                          ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 text-white shadow-blue-500/30 ring-2 ring-blue-500/40'
                          : 'bg-gradient-to-tr from-slate-700 to-slate-600 text-slate-200 ring-2 ring-slate-700/40'
                      }`}
                    >
                      {participant.username ? participant.username.charAt(0).toUpperCase() : 'U'}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      {/* Line 1: Larger Username & "You" Badge */}
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-base sm:text-lg font-bold text-white truncate leading-tight tracking-tight">
                          {participant.username}
                        </p>
                        {isCurrentUser && (
                          <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                            You
                          </span>
                        )}
                      </div>

                      {/* Line 2: Role Badge below username */}
                      <div className="flex items-center mt-1">
                        {isHost && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/35 text-amber-300 shadow-sm shadow-amber-500/10">
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            Host
                          </span>
                        )}

                        {isModerator && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/35 text-blue-300 shadow-sm shadow-blue-500/10">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            Moderator
                          </span>
                        )}

                        {isParticipant && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/90 border border-slate-700/80 text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Participant
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM SECTION: Admin Host Action Controls */}
                  {isCurrentHost && !isHost && (
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-col sm:flex-row flex-wrap gap-2 w-full items-stretch">
                      {/* Transfer Host Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTargetToTransfer(participant.username)}
                        className="flex-1 min-w-[120px] text-xs py-2 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 font-semibold rounded-xl shadow-sm transition-all duration-200 focus:ring-2 focus:ring-amber-500/50"
                        title={`Transfer Host to ${participant.username}`}
                        aria-label={`Transfer Host to ${participant.username}`}
                      >
                        <Crown className="w-3.5 h-3.5 mr-1 text-amber-400 shrink-0" />
                        Transfer Host
                      </Button>

                      {isParticipant && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAssignRole(participant.username, 'Moderator')}
                          className="flex-1 min-w-[130px] text-xs py-2 px-3 bg-indigo-950/30 hover:bg-indigo-900/50 text-indigo-300 hover:text-white border border-indigo-500/40 hover:border-indigo-400 font-semibold rounded-xl shadow-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50"
                          title="Promote to Moderator"
                          aria-label={`Promote ${participant.username} to Moderator`}
                        >
                          <UserPlus className="w-4 h-4 mr-1.5 text-indigo-400 shrink-0" />
                          Assign Moderator
                        </Button>
                      )}

                      {isModerator && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAssignRole(participant.username, 'Participant')}
                          className="flex-1 min-w-[130px] text-xs py-2 px-3 bg-blue-950/30 hover:bg-blue-900/50 text-blue-300 hover:text-white border border-blue-500/40 hover:border-blue-400 font-semibold rounded-xl shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/50"
                          title="Demote to Participant"
                          aria-label={`Demote ${participant.username} to Participant`}
                        >
                          <UserMinus className="w-4 h-4 mr-1.5 text-blue-400 shrink-0" />
                          Remove Moderator
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveParticipant(participant.username)}
                        className="flex-1 min-w-[110px] text-xs py-2 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold shadow-md shadow-rose-600/20 border border-rose-500/40 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-rose-500/50"
                        title="Remove User from Room"
                        aria-label={`Remove ${participant.username} from room`}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 shrink-0" />
                        Remove User
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state when only 1 participant (Host alone in room) */}
            {participants.length === 1 && (
              <div className="mt-3.5 p-4 text-center space-y-2 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800/80">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-full w-10 h-10 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">Waiting for Participants</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Invite others using the room code.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Confirmation Modal for Host Transfer */}
      {targetToTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center space-x-3 text-amber-400">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Transfer Host Privileges</h3>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Transfer host privileges to <span className="font-bold text-amber-300">"{targetToTransfer}"</span>?
              <br />
              <span className="text-slate-400 text-xs mt-1 block">
                This action cannot be undone automatically. You will lose room host controls unless transferred back.
              </span>
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTargetToTransfer(null)}
                className="px-4 py-2 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmTransferHost}
                className="px-4 py-2 text-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold border-amber-400/50 shadow-amber-500/25"
              >
                Transfer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParticipantList;
