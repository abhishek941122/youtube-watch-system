import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import { PlayerPlaceholder } from '../components/PlayerPlaceholder.jsx';
import YouTubePlayer from '../components/YouTubePlayer.jsx';
import HostVideoControls from '../components/HostVideoControls.jsx';
import ParticipantList from '../components/ParticipantList.jsx';
import RoomChat from '../components/RoomChat.jsx';
import { ReactionsBar, FloatingReactionsOverlay } from '../components/EmojiReactions.jsx';
import {
  PlayerSkeleton,
  RoomHeaderSkeleton,
  ParticipantListSkeleton,
  NowPlayingSkeleton,
} from '../components/Skeletons.jsx';
import { getRoomApi } from '../services/api.js';
import socket from '../services/socketService.js';
import { getUserData } from '../utils/helpers.js';
import { canControlPlayback } from '../utils/permissions.js';
import { AlertCircle, Home, Copy, Check, Play, Pause, Crown, ShieldCheck, User, Tv, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export const RoomPage = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketConnecting, setSocketConnecting] = useState(true);
  const [socketError, setSocketError] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [reactions, setReactions] = useState([]);

  const playerRef = useRef(null);
  const isSyncingRef = useRef(false);
  const initialAppliedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const pendingPlaybackStateRef = useRef(null);
  const wasDisconnectedRef = useRef(false);

  // Helper 1: Apply Initial Room State with Robust Polling
  const applyRoomPlaybackState = (roomData, player) => {
    if (!roomData || !player) return;

    const { currentTime, isPlaying, currentVideoId: roomVid } = roomData;
    isSyncingRef.current = true;

    try {
      // Explicitly load the video ID to prevent black screens on fresh load
      const vidId = roomVid || currentVideoId;
      if (vidId && typeof player.loadVideoById === "function") {
        player.loadVideoById(vidId, currentTime || 0);
      } else if (typeof currentTime === "number" && currentTime > 0) {
        player.seekTo(currentTime, true);
      }

      if (isPlaying) {
        setTimeout(() => {
          if (typeof player.playVideo === "function") player.playVideo();
          isSyncingRef.current = false;
        }, 300);
      } else {
        // Robust Play-then-Pause Polling Trick
        if (typeof player.playVideo === "function") player.playVideo();

        let attempts = 0;
        const pollInterval = setInterval(() => {
          attempts++;
          const state = typeof player.getPlayerState === "function" ? player.getPlayerState() : -1;

          // 1 = PLAYING. Once it hits playing, the visual frame is loaded.
          if (state === 1) {
            player.pauseVideo();
            player.seekTo(currentTime || 0, true); // Snap precisely to timestamp
            clearInterval(pollInterval);
            isSyncingRef.current = false;
          } else if (attempts > 40) { // 4-second safety timeout
            player.pauseVideo();
            clearInterval(pollInterval);
            isSyncingRef.current = false;
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
      isSyncingRef.current = false;
    }
  };

  // Helper 2: Apply Socket Sync State with Robust Polling
  const applyPendingPlaybackState = () => {
    if (!playerRef.current || !pendingPlaybackStateRef.current) return;

    const { currentTime, isPlaying } = pendingPlaybackStateRef.current;
    isSyncingRef.current = true;

    try {
      if (typeof currentTime === "number" && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(currentTime, true);
      }

      if (isPlaying) {
        setTimeout(() => {
          if (typeof playerRef.current?.playVideo === "function") {
            playerRef.current.playVideo();
          }
          isSyncingRef.current = false;
          pendingPlaybackStateRef.current = null;
        }, 300);
      } else {
        // Robust Play-then-Pause Polling Trick
        if (typeof playerRef.current?.playVideo === "function") {
          playerRef.current.playVideo();
        }

        let attempts = 0;
        const pollInterval = setInterval(() => {
          attempts++;
          const state = typeof playerRef.current?.getPlayerState === "function" ? playerRef.current.getPlayerState() : -1;

          if (state === 1) {
            playerRef.current.pauseVideo();
            playerRef.current.seekTo(currentTime || 0, true);
            clearInterval(pollInterval);
            isSyncingRef.current = false;
            pendingPlaybackStateRef.current = null;
          } else if (attempts > 40) {
            playerRef.current?.pauseVideo();
            clearInterval(pollInterval);
            isSyncingRef.current = false;
            pendingPlaybackStateRef.current = null;
          }
        }, 100);
      }
    } catch (err) {
      console.error(err);
      isSyncingRef.current = false;
      pendingPlaybackStateRef.current = null;
    }
  };

  // 1. Initial Room Details Fetch via REST API
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;
      try {
        setLoading(true);
        setError('');
        const res = await getRoomApi(roomId);
        if (res.success && res.data) {
          const { username: localUsername } = getUserData();
          const isRemoved =
            Array.isArray(res.data.removedParticipants) &&
            res.data.removedParticipants.some(
              (name) => name.toLowerCase() === localUsername?.toLowerCase()
            );

          if (isRemoved) {
            setRoom(null);
            setError('You have been removed from this room by the host.');
            toast.error('Room does not exist.');
            return;
          }

          setRoom(res.data);
          if (res.data.currentVideoId) {
            setCurrentVideoId(res.data.currentVideoId);
          }
        } else {
          setError(res.message || 'Room not found.');
          toast.error('Room does not exist.');
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to load room details.';
        setError(msg);
        toast.error('Room does not exist.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  // 2. Real-time Socket.IO Connection & Event Listeners
  useEffect(() => {
    if (!roomId) return;

    const { username: localUsername } = getUserData();

    if (!localUsername) {
      setSocketError('Display name not found. Please join room with a valid username.');
      setSocketConnecting(false);
      return;
    }

    setSocketConnecting(true);
    setSocketError('');

    if (!socket.connected) {
      socket.connect();
    }

    const joinPayload = {
      roomId,
      username: localUsername,
    };

    const handleConnect = () => {
      if (wasDisconnectedRef.current) {
        toast.info('Reconnected successfully.');
        wasDisconnectedRef.current = false;
      }
      socket.emit('join-room', joinPayload);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    // Event: room-joined
    const handleRoomJoined = (data) => {
      setSocketConnecting(false);
      setSocketError("");

      if (data?.success && data?.room) {
        initialAppliedRef.current = false;
        setRoom(data.room);
        if (data.room.currentVideoId) {
          setCurrentVideoId(data.room.currentVideoId);
        }
      }
    };

    // Event: user-joined
    const handleUserJoined = (data) => {
      if (data?.room) {
        setRoom(data.room);
      }
      if (data?.username && data.username.toLowerCase() !== localUsername?.toLowerCase()) {
        toast.info(`${data.username} joined the watch party.`);
      }
    };

    // Event: user-left
    const handleUserLeft = (data) => {
      if (data?.room) {
        setRoom(data.room);
      }
      if (data?.username && data.username.toLowerCase() !== localUsername?.toLowerCase()) {
        toast.info(`${data.username} left the watch party.`);
      }
    };

    // Event: role-assigned
    const handleRoleAssigned = (data) => {
      if (data?.participants) {
        setRoom((prev) => (prev ? { ...prev, participants: data.participants } : prev));
      } else if (data?.room) {
        setRoom(data.room);
      }
      if (data?.role === 'Moderator') {
        toast.success('Participant promoted to Moderator.');
      } else if (data?.role === 'Participant') {
        toast.success('Moderator changed back to Participant.');
      }
    };

    // Event: host-transferred
    const handleHostTransferred = (data) => {
      if (data?.participants) {
        setRoom((prev) => (prev ? { ...prev, participants: data.participants, hostUsername: data.newHostUsername } : prev));
      } else if (data?.room) {
        setRoom(data.room);
      }

      const { username: currentUsername } = getUserData();
      if (data?.newHostUsername?.toLowerCase() === currentUsername?.toLowerCase()) {
        toast.info("You are now the Host.");
      } else if (data?.oldHostUsername?.toLowerCase() === currentUsername?.toLowerCase()) {
        toast.info(`Host privileges transferred to ${data?.newHostUsername}.`);
      } else {
        toast.success("Host transferred successfully.");
      }
    };

    // Event: participant-removed
    const handleParticipantRemoved = (data) => {
      const { username: currentUsername } = getUserData();
      if (data?.username?.toLowerCase() === currentUsername?.toLowerCase()) {
        setSocketError('You have been removed from the room by the host.');
        setRoom(null);
        setError('You have been removed from this room by the host.');
        toast.error('You have been removed from the room.');
        return;
      }
      if (data?.participants) {
        setRoom((prev) => (prev ? { ...prev, participants: data.participants } : prev));
      } else if (data?.room) {
        setRoom(data.room);
      }
      toast.success('Participant removed from room.');
    };

    // Event: room-access-denied
    const handleRoomAccessDenied = (data) => {
      const msg = data?.message || 'You have been removed from this room by the host.';
      setSocketConnecting(false);
      setSocketError(msg);
      setRoom(null);
      setError(msg);
      toast.error('Room does not exist.');
    };

    // Event: receive-reaction
    const handleReceiveReaction = (reaction) => {
      if (!reaction || !reaction.id) return;
      setReactions((prev) => [...prev, reaction]);

      // Automatically remove reaction from state after 2500ms
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    };

    // Event: request-playback-state (Host receives this when a new participant joins/refreshes)
    const handleRequestPlaybackState = (data) => {
      if (!data?.requesterSocketId) return;

      const curTime = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
      const playerState = playerRef.current?.getPlayerState ? playerRef.current.getPlayerState() : -1;
      const isPlaying = playerState === 1;

      socket.emit('playback-state', {
        roomId,
        requesterSocketId: data.requesterSocketId,
        currentVideoId,
        currentTime: curTime,
        isPlaying,
      });
    };

    const handleSyncPlaybackState = (data) => {
      if (!data) return;

      const {
        currentVideoId: syncVideoId,
        currentTime,
        isPlaying,
      } = data;

      pendingPlaybackStateRef.current = {
        currentTime,
        isPlaying,
      };

      initialAppliedRef.current = false;

      if (syncVideoId && syncVideoId !== currentVideoId) {
        setCurrentVideoId(syncVideoId);
        return;
      }

      applyPendingPlaybackState();
    };

    // Event: video-changed
    const handleVideoChanged = (data) => {
      if (!data?.videoId) return;

      pendingPlaybackStateRef.current = {
        currentTime: data.currentTime || 0,
        isPlaying: data.isPlaying,
      };

      initialAppliedRef.current = false;
      setCurrentVideoId(data.videoId);
    };

    // Event: sync-play
    const handleSyncPlay = (data) => {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        isSyncingRef.current = true;
        try {
          if (data?.currentTime !== undefined && typeof playerRef.current.seekTo === 'function') {
            const curTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
            if (Math.abs(curTime - data.currentTime) >= 1.0) {
              playerRef.current.seekTo(data.currentTime, true);
            }
          }
          playerRef.current.playVideo();
        } catch (err) {
          console.error('Failed to sync play video:', err);
        }
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 500);
      }
    };

    // Event: sync-pause
    const handleSyncPause = (data) => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        isSyncingRef.current = true;
        try {
          if (data?.currentTime !== undefined && typeof playerRef.current.seekTo === 'function') {
            const curTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
            if (Math.abs(curTime - data.currentTime) >= 1.0) {
              playerRef.current.seekTo(data.currentTime, true);
            }
          }
          playerRef.current.pauseVideo();
        } catch (err) {
          console.error('Failed to sync pause video:', err);
        }
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 500);
      }
    };

    // Event: sync-seek
    const handleSyncSeek = (data) => {
      if (!data || data.currentTime === undefined) return;
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        const curTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        if (Math.abs(curTime - data.currentTime) >= 1.0) {
          isSyncingRef.current = true;
          try {
            playerRef.current.seekTo(data.currentTime, true);
            if (data.isPlaying) {
              playerRef.current.playVideo();
            } else {
              playerRef.current.pauseVideo();
            }
          } catch (err) {
            console.error('Failed to sync seek:', err);
          }
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 500);
        }
      }
    };

    // Socket Errors & Disconnection
    const handleSocketError = (err) => {
      setSocketConnecting(false);
      setSocketError(err?.message || 'Socket room error.');
      toast.error('Room does not exist.');
    };

    const handleConnectError = () => {
      setSocketConnecting(false);
      setSocketError('Failed to connect to real-time server.');
      wasDisconnectedRef.current = true;
      toast.error('Connection to server lost.');
    };

    const handleDisconnect = (reason) => {
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setSocketError('Disconnected from watch party server.');
        wasDisconnectedRef.current = true;
        toast.error('Connection to server lost.');
      }
    };

    // Attach listeners
    socket.on('room-joined', handleRoomJoined);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('role-assigned', handleRoleAssigned);
    socket.on('host-transferred', handleHostTransferred);
    socket.on('participant-removed', handleParticipantRemoved);
    socket.on('room-access-denied', handleRoomAccessDenied);
    socket.on('receive-reaction', handleReceiveReaction);
    socket.on('request-playback-state', handleRequestPlaybackState);
    socket.on('sync-playback-state', handleSyncPlaybackState);
    socket.on('video-changed', handleVideoChanged);
    socket.on('sync-play', handleSyncPlay);
    socket.on('sync-pause', handleSyncPause);
    socket.on('sync-seek', handleSyncSeek);
    socket.on('error', handleSocketError);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    // Clean up on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('room-joined', handleRoomJoined);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('role-assigned', handleRoleAssigned);
      socket.off('host-transferred', handleHostTransferred);
      socket.off('participant-removed', handleParticipantRemoved);
      socket.off('room-access-denied', handleRoomAccessDenied);
      socket.off('receive-reaction', handleReceiveReaction);
      socket.off('request-playback-state', handleRequestPlaybackState);
      socket.off('sync-playback-state', handleSyncPlaybackState);
      socket.off('video-changed', handleVideoChanged);
      socket.off('sync-play', handleSyncPlay);
      socket.off('sync-pause', handleSyncPause);
      socket.off('sync-seek', handleSyncSeek);
      socket.off('error', handleSocketError);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);

      socket.emit('leave-room');
      socket.disconnect();
    };
  }, [roomId]);

  const participants = room?.participants || [];
  const { username: localUsername } = getUserData();
  const currentParticipant = participants.find(
    (p) => p.username?.toLowerCase() === localUsername?.toLowerCase()
  );
  const isHost = currentParticipant?.role === 'Host';
  const canControl = canControlPlayback(currentParticipant?.role);

  // 3. Host Playback Heartbeat & Seek Detection (every 2.5 seconds)
  useEffect(() => {
    if (!isHost || !roomId) return;
    const { username: localUsername } = getUserData();

    const intervalId = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const currentTime = playerRef.current.getCurrentTime();
        const playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        const isPlaying = playerState === 1;

        const diff = Math.abs(currentTime - lastTimeRef.current);
        if (diff > 1.5 && !isSyncingRef.current) {
          socket.emit('host-seek', {
            roomId,
            username: localUsername,
            currentTime,
          });
        }

        lastTimeRef.current = currentTime;

        socket.emit('playback-state-update', {
          roomId,
          username: localUsername,
          currentTime,
          isPlaying,
        });
      } catch (err) {
        // Player might not be ready yet
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [isHost, roomId]);

  const handleCopyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room code copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  const handleSendReaction = (emoji) => {
    if (!roomId || !emoji) return;
    socket.emit('send-reaction', {
      roomId,
      emoji,
      username: localUsername,
    });
  };

  const handleVideoLoaded = (videoId, updatedRoom) => {
    setCurrentVideoId(videoId);
    initialAppliedRef.current = false;

    // 1. Set pending state for the host
    pendingPlaybackStateRef.current = {
      currentTime: 0,
      isPlaying: true
    };

    if (updatedRoom) {
      setRoom(updatedRoom);
    } else {
      setRoom((prev) => (prev ? { ...prev, currentVideoId: videoId, currentTime: 0, isPlaying: true } : prev));
    }

    // 2. Explicitly force the Host's iframe to load the new video ID
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      isSyncingRef.current = true;
      try {
        playerRef.current.loadVideoById(videoId, 0);

        // Wait a brief moment for the video to cue before playing
        setTimeout(() => {
          if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
          isSyncingRef.current = false;
        }, 500);
      } catch (err) {
        console.error("Host failed to load video internally:", err);
        isSyncingRef.current = false;
      }
    }

    // 3. Broadcast the change to all other participants
    const { username: localUsername } = getUserData();
    socket.emit('host-video-change', {
      roomId,
      username: localUsername,
      videoId,
      currentTime: 0,
      isPlaying: true,
    });
  };

  // YouTube Player Event Handlers
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;

    if (pendingPlaybackStateRef.current) {
      applyPendingPlaybackState();
      initialAppliedRef.current = true;
      return;
    }

    if (room && !initialAppliedRef.current) {
      applyRoomPlaybackState(room, event.target);
      initialAppliedRef.current = true;
    }
  };

  const handlePlayerPlay = () => {
    if (isSyncingRef.current) return;

    if (!canControl) {
      isSyncingRef.current = true;
      playerRef.current?.pauseVideo();
      toast.warning("You don't have permission for this action.");

      setTimeout(() => {
        isSyncingRef.current = false;
      }, 300);

      return;
    }

    if (!currentVideoId) {
      toast.warning('Load a YouTube video first.');
      return;
    }

    const curTime = playerRef.current?.getCurrentTime
      ? playerRef.current.getCurrentTime()
      : 0;

    socket.emit("host-play", {
      roomId,
      username: localUsername,
      currentTime: curTime,
    });
  };

  const handlePlayerPause = () => {
    if (isSyncingRef.current) return;
    if (canControl) {
      const curTime = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
      socket.emit('host-pause', { roomId, username: localUsername, currentTime: curTime });
    }
  };

  // 1. Loading State: Render Skeleton Layout matching exact dimensions
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <RoomHeaderSkeleton />
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="order-1 lg:order-none lg:col-span-2 space-y-4">
            <PlayerSkeleton />
            <NowPlayingSkeleton />
          </div>
          <div className="order-2 lg:order-none lg:col-span-1">
            <ParticipantListSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // 2. Room Not Found / Access Denied Empty State
  if (error || !room) {
    return (
      <div className="max-w-md mx-auto py-8 sm:py-12 text-center px-4 animate-fade-in">
        <Card className="border-rose-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
          <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/10">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2.5">
            {error?.includes('removed') ? 'Access Denied' : 'Room Not Found'}
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
            {error || 'The requested watch party room does not exist.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="primary" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2 shrink-0" />
                Create Room
              </Button>
            </Link>
            <Link to="/join">
              <Button variant="secondary" className="w-full sm:w-auto">
                Join Another Room
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Disconnected / Socket Error Banner Empty State */}
      {socketError && (
        <div className="flex items-center space-x-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm shadow-lg backdrop-blur-md animate-fade-in">
          <WifiOff className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-rose-300">Connection Lost</span>
            <span className="text-xs text-rose-400/90">— Attempting to reconnect...</span>
          </div>
        </div>
      )}

      {/* Top Banner (Room Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-indigo-950/40 p-4 sm:p-5 rounded-2xl border border-slate-800/90 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm shrink-0">
              Room Code
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono tracking-widest text-indigo-400 bg-slate-950/80 px-3 sm:px-3.5 py-0.5 rounded-xl border border-indigo-500/30 shadow-inner shrink-0">
              {room.roomId}
            </h2>
            {socketConnecting ? (
              <span className="inline-flex items-center text-xs font-semibold text-amber-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 shrink-0">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Connecting...
              </span>
            ) : socketError ? (
              <span className="inline-flex items-center text-xs font-semibold text-rose-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/10 border border-rose-500/30 shrink-0">
                <span className="h-2 w-2 rounded-full bg-rose-500 mr-2 shrink-0"></span>
                Disconnected
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-sm shrink-0">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">Share this code with your friends to watch YouTube together in sync.</p>
        </div>

        <Button
          onClick={handleCopyCode}
          variant={copied ? 'outline' : 'secondary'}
          size="sm"
          className="w-full sm:w-auto min-w-[130px] self-stretch sm:self-auto shrink-0 transition-all duration-200"
        >
          <span className="relative flex items-center justify-center">
            {copied ? (
              <span className="flex items-center animate-fade-in">
                <Check className="w-4 h-4 mr-2 text-emerald-400 shrink-0 transition-transform duration-200 scale-110" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </span>
            ) : (
              <span className="flex items-center animate-fade-in">
                <Copy className="w-4 h-4 mr-2 text-indigo-400 shrink-0 transition-transform duration-200" />
                <span>Copy Code</span>
              </span>
            )}
          </span>
        </Button>
      </div>

      {/* Main Grid / Stacking Order Section */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 1. Player Section & Emoji Reaction Bar */}
        <div className="order-1 lg:order-none lg:col-span-2 space-y-3">
          <div className="relative overflow-hidden rounded-2xl">
            <FloatingReactionsOverlay reactions={reactions} />
            {currentVideoId ? (
              <YouTubePlayer
                videoId={currentVideoId}
                onReady={handlePlayerReady}
                onPlay={handlePlayerPlay}
                onPause={handlePlayerPause}
              />
            ) : (
              <PlayerPlaceholder />
            )}
          </div>

          <ReactionsBar onReact={handleSendReaction} />
        </div>

        {/* 2. Participants Section & Room Chat (Mobile: Order 2, Desktop: Right Column) */}
        <div className="order-2 lg:order-none lg:col-span-1 lg:row-span-3 space-y-4">
          <ParticipantList
            roomId={room.roomId}
            participants={participants}
            localUsername={localUsername}
          />
          <RoomChat
            roomId={room.roomId}
            localUsername={localUsername}
          />
        </div>

        {/* 3. Playback Controls Section (Mobile: Order 3, Desktop: Left Column) */}
        {canControl && (
          <div className="order-3 lg:order-none lg:col-span-2">
            <HostVideoControls
              roomId={room.roomId}
              onVideoLoaded={handleVideoLoaded}
            />
          </div>
        )}

        {/* 4. Now Playing Section (Mobile: Order 4, Desktop: Left Column) */}
        <div className="order-4 lg:order-none lg:col-span-2">
          <Card
            title="Now Playing"
            subtitle="Current playback session status and video details"
            headerAction={<Tv className="w-5 h-5 text-indigo-400" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Video ID</span>
                <p className="text-sm font-mono font-bold text-white truncate">
                  {currentVideoId || 'None'}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Playback Status</span>
                <div>
                  {currentVideoId ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Play className="w-3 h-3 mr-1 fill-emerald-400 shrink-0" />
                      Active Stream
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <Pause className="w-3 h-3 mr-1 fill-amber-400 shrink-0" />
                      Waiting Video
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Role</span>
                <div>
                  {isHost ? (
                    <span className="inline-flex items-center text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 transition-all duration-300 animate-fade-in">
                      <Crown className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400 shrink-0" />
                      Host
                    </span>
                  ) : currentParticipant?.role === 'Moderator' ? (
                    <span className="inline-flex items-center text-xs font-bold text-blue-300 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 transition-all duration-300 animate-fade-in">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-400 shrink-0" />
                      Moderator
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-slate-300 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 transition-all duration-300 animate-fade-in">
                      <User className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      Participant
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;