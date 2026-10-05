import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import { createRoomApi } from '../services/api.js';
import { saveUserData, getUserData } from '../utils/helpers.js';
import { Tv, Plus, Sparkles, AlertCircle, ShieldCheck, Zap, Users } from 'lucide-react';
import { toast } from 'sonner';

export const HomePage = () => {
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

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = username.trim();
    if (!trimmedName) {
      setError('Please enter a display name.');
      return;
    }

    try {
      setLoading(true);
      const res = await createRoomApi(trimmedName);

      if (res.success && res.data?.roomId) {
        const createdRoomId = res.data.roomId;
        saveUserData(trimmedName, createdRoomId);
        toast.success('Watch party created successfully.');
        navigate(`/room/${createdRoomId}`);
      } else {
        setError(res.message || 'Failed to create room. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Server error. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-12 px-3.5 sm:px-4 space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex p-3.5 sm:p-4 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/20 mb-1 sm:mb-2 transform hover:scale-105 transition-transform duration-300">
          <Tv className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          Watch YouTube Together{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            In Real Time
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-lg mx-auto leading-relaxed">
          Create a private watch party room, invite friends with a code, and enjoy instant synchronized playback.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-indigo-400 mr-1.5 shrink-0" />
            Sub-second Sync
          </span>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
            Role Permissions
          </span>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            <Users className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
            Multi-user Rooms
          </span>
        </div>
      </div>

      {/* Main Form Card */}
      <Card title="Start a Watch Party" subtitle="Enter your display name to create a room as Host">
        <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="flex items-center space-x-2 p-3 sm:p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm shadow-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <Input
            label="Your Display Name"
            placeholder="Enter your name (e.g. Alex)"
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
              <Loader size="sm" text="Creating Room..." />
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2 shrink-0" />
                Create New Watch Party
              </>
            )}
          </Button>

          <div className="pt-1 text-center text-xs text-slate-500 flex items-center justify-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>A unique 6-character room code will be generated</span>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default HomePage;
