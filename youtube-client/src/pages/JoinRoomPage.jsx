import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import { joinRoomApi } from '../services/api.js';
import { saveUserData, getUserData } from '../utils/helpers.js';
import { LogIn, Users, AlertCircle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export const JoinRoomPage = () => {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = getUserData();
    if (saved.username) {
      setUsername(saved.username);
    }
  }, []);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedCode = roomCode.trim().toUpperCase();
    const trimmedName = username.trim();

    if (!trimmedCode) {
      setError('Please enter a room code.');
      return;
    }

    if (!trimmedName) {
      setError('Please enter a display name.');
      return;
    }

    try {
      setLoading(true);
      const res = await joinRoomApi(trimmedCode, trimmedName);

      if (res.success && res.data?.roomId) {
        saveUserData(trimmedName, res.data.roomId);
        toast.success('Joined room successfully.');
        navigate(`/room/${res.data.roomId}`);
      } else {
        toast.error('Unable to join room.');
        setError(res.message || 'Failed to join room. Please check the room code.');
      }
    } catch (err) {
      toast.error('Unable to join room.');
      const msg = err.response?.data?.message || err.message || 'Failed to join room. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-12 px-3.5 sm:px-4 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2.5 sm:space-y-3">
        <div className="inline-flex p-3.5 sm:p-4 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl text-white shadow-xl shadow-purple-600/30 border border-purple-400/20 mb-1 sm:mb-2 transform hover:scale-105 transition-transform duration-300">
          <Users className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
          Join Watch Party
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          Enter an existing room code and your display name to join the stream instantly.
        </p>
      </div>

      <Card title="Room Code & Info" subtitle="Fill out the details below to join your friends">
        <form onSubmit={handleJoinRoom} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="flex items-center space-x-2 p-3 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm shadow-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <Input
              label="Room Code"
              placeholder="e.g. D3PS2G"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              required
              disabled={loading}
              className="font-mono tracking-widest uppercase font-bold text-center text-lg py-3 sm:py-3.5"
            />
          </div>

          <Input
            label="Your Display Name"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError('');
            }}
            required
            disabled={loading}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full shadow-xl" disabled={loading}>
            {loading ? (
              <Loader size="sm" text="Joining Room..." />
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2 shrink-0" />
                Join Watch Party
              </>
            )}
          </Button>

          <div className="pt-1 text-center text-xs text-slate-500 flex items-center justify-center space-x-1">
            <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Room code is provided by the room Host</span>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default JoinRoomPage;
