import Room from '../models/Room.js';
import { findRoomByRoomId } from '../utils/findRoomByRoomId.js';
import {
  canControlPlayback,
  canAssignRoles,
  canRemoveParticipant,
  getUserRoleInRoom,
} from '../utils/permissions.js';

// In-memory store for pending disconnect grace period timeouts
// Key: `${roomId}_${username.toLowerCase()}` -> Timeout ID
const disconnectTimeouts = new Map();

// In-memory store for Room Chat History (Max 100 messages per room)
// Key: `roomId` -> Array of message objects
const roomMessages = new Map();

/**
 * Add a new chat message to room memory
 */
const addRoomChatMessage = (roomId, username, text) => {
  if (!roomId || !username || !text) return null;
  const trimmedText = text.trim();
  if (!trimmedText) return null;

  if (!roomMessages.has(roomId)) {
    roomMessages.set(roomId, []);
  }
  const history = roomMessages.get(roomId);
  const message = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    username: username.trim(),
    text: trimmedText,
    timestamp: new Date().toISOString(),
  };
  history.push(message);
  if (history.length > 100) {
    history.shift(); // Capped at latest 100 messages per room
  }
  return message;
};

/**
 * Get room chat history
 */
const getRoomChatHistory = (roomId) => {
  return roomMessages.get(roomId) || [];
};

/**
 * Cancel pending disconnect timeout for a user in a room if they reconnected
 */
const cancelDisconnectTimeout = (roomId, username) => {
  if (!roomId || !username) return;
  const key = `${roomId}_${username.trim().toLowerCase()}`;
  if (disconnectTimeouts.has(key)) {
    clearTimeout(disconnectTimeouts.get(key));
    disconnectTimeouts.delete(key);
    console.log(`[Socket] Cancelled disconnect timeout for ${username} in room ${roomId}`);
  }
};

/**
 * Schedule participant removal after a 5-second grace period upon disconnection
 */
const scheduleUserLeave = (io, roomId, username) => {
  if (!roomId || !username) return;
  const trimmedUsername = username.trim();
  const key = `${roomId}_${trimmedUsername.toLowerCase()}`;

  // Cancel any existing timeout for this user first
  if (disconnectTimeouts.has(key)) {
    clearTimeout(disconnectTimeouts.get(key));
  }

  const timeoutId = setTimeout(async () => {
    disconnectTimeouts.delete(key);
    try {
      const room = await findRoomByRoomId(roomId);
      if (!room) return;

      const participantIndex = room.participants.findIndex(
        (p) => p.username.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (participantIndex === -1) return;

      // Remove participant from MongoDB after 5s grace period
      room.participants.splice(participantIndex, 1);

      if (room.participants.length === 0) {
        // Delete room if all participants left
        await Room.deleteOne({ _id: room._id });
        roomMessages.delete(roomId); // Clean up in-memory chat
        console.log(`[Socket] Room Deleted: ${roomId} (all participants left)`);
      } else {
        // Transfer Host to oldest participant if the Host disconnected permanently
        if (room.hostUsername && room.hostUsername.toLowerCase() === trimmedUsername.toLowerCase()) {
          const newHost = room.participants[0];
          newHost.role = 'Host';
          room.hostUsername = newHost.username;
          room.hostSocketId = newHost.socketId;
          console.log(`[Socket] Host transferred in ${roomId} to ${newHost.username}`);
        }

        await room.save();

        // Broadcast user-left to remaining participants in the room
        io.to(roomId).emit('user-left', {
          username: trimmedUsername,
          room,
        });

        console.log(`[Socket] User ${trimmedUsername} removed from room ${roomId} after timeout expiration`);
      }
    } catch (error) {
      console.error(`[Socket Error] Disconnect timeout execution failed: ${error.message}`);
    }
  }, 5000);

  disconnectTimeouts.set(key, timeoutId);
  console.log(`[Socket] Scheduled 5s disconnect timeout for ${trimmedUsername} in room ${roomId}`);
};

/**
 * Handle participant leaving a room or disconnecting
 */
const handleUserLeave = async (io, socket) => {
  try {
    const room = await Room.findOne({ 'participants.socketId': socket.id });
    if (!room) return;

    const participant = room.participants.find((p) => p.socketId === socket.id);
    if (!participant) return;

    const username = participant.username;
    const roomId = room.roomId;

    socket.leave(roomId);

    // Schedule 5-second grace period before actual removal
    scheduleUserLeave(io, roomId, username);
  } catch (error) {
    console.error(`[Socket Error] Failed to handle user leave: ${error.message}`);
  }
};

/**
 * Initialize Socket.IO connection event listeners
 */
export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] User Connected: ${socket.id}`);

    // Event: join-room
    socket.on('join-room', async (data) => {
      try {
        const { roomId, username } = data || {};

        if (!roomId || !username) {
          return socket.emit('error', {
            success: false,
            message: 'RoomId and username are required',
          });
        }

        const room = await findRoomByRoomId(roomId);

        if (!room) {
          return socket.emit('error', {
            success: false,
            message: 'Room not found',
          });
        }

        const trimmedUsername = username.trim();

        // Check if participant was removed from this room by the host
        const isRemoved =
          Array.isArray(room.removedParticipants) &&
          room.removedParticipants.some(
            (name) => name.toLowerCase() === trimmedUsername.toLowerCase()
          );

        if (isRemoved) {
          console.warn(`[Socket Warning] Blocked removed user ${trimmedUsername} from rejoining room ${roomId}`);
          return socket.emit('room-access-denied', {
            success: false,
            message: 'You have been removed from this room by the host.',
          });
        }

        // Cancel any pending disconnect removal timeout for this user
        cancelDisconnectTimeout(roomId, trimmedUsername);

        // Join Socket.IO room channel
        socket.join(room.roomId);

        // Identify participant by username (not socket.id)
        let participant = room.participants.find(
          (p) => p.username.toLowerCase() === trimmedUsername.toLowerCase()
        );

        if (participant) {
          // Update socketId for reconnecting participant
          participant.socketId = socket.id;

          // Host recovery: restore Host role if username matches hostUsername or participant was Host
          if (
            (room.hostUsername && room.hostUsername.toLowerCase() === trimmedUsername.toLowerCase()) ||
            participant.role === 'Host'
          ) {
            participant.role = 'Host';
            room.hostUsername = participant.username;
            room.hostSocketId = socket.id;
          }
        } else {
          // Create new participant
          const isHost =
            room.participants.length === 0 ||
            (room.hostUsername && room.hostUsername.toLowerCase() === trimmedUsername.toLowerCase());

          const role = isHost ? 'Host' : 'Participant';

          participant = {
            socketId: socket.id,
            username: trimmedUsername,
            role,
          };

          room.participants.push(participant);

          if (isHost) {
            room.hostUsername = trimmedUsername;
            room.hostSocketId = socket.id;
          }
        }

        await room.save();

        console.log(`[Socket] Room Joined: ${room.roomId} by ${trimmedUsername} (${socket.id})`);

        // Emit room-joined to the connecting user
        socket.emit('room-joined', {
          success: true,
          message: 'Joined room successfully',
          room,
        });

        // Broadcast user-joined to all other users in the room
        socket.to(room.roomId).emit('user-joined', {
          username: trimmedUsername,
          socketId: socket.id,
          room,
        });

        // Emit chat history to joining participant
        socket.emit('chat-history', {
          messages: getRoomChatHistory(room.roomId),
        });

        // Request live playback state from Host if Host is active in room (and is not the joining user)
        const activeHost = room.participants.find(
          (p) => p.role === 'Host' && p.socketId !== socket.id
        );

        if (activeHost && activeHost.socketId) {
          io.to(activeHost.socketId).emit('request-playback-state', {
            requesterSocketId: socket.id,
            roomId: room.roomId,
          });
        } else {
          // Fallback to room DB playback state
          socket.emit('sync-playback-state', {
            currentVideoId: room.currentVideoId,
            currentTime: room.currentTime,
            isPlaying: room.isPlaying,
          });
        }
      } catch (error) {
        console.error(`[Socket Error] Error in join-room: ${error.message}`);
        socket.emit('error', {
          success: false,
          message: 'Internal server error while joining room',
        });
      }
    });

    // Dedicated Event: send-chat-message
    socket.on('send-chat-message', (data) => {
      try {
        const { roomId, username, text } = data || {};
        if (!roomId || !username || !text) {
          return socket.emit('chat-error', { message: 'Failed to send message.' });
        }

        const message = addRoomChatMessage(roomId, username, text);
        if (!message) {
          return socket.emit('chat-error', { message: 'Failed to send message.' });
        }

        // Broadcast new message to all participants in the room
        io.to(roomId).emit('new-message', message);
      } catch (error) {
        console.error(`[Socket Error] Error in send-chat-message: ${error.message}`);
        socket.emit('chat-error', { message: 'Failed to send message.' });
      }
    });

    // Dedicated Event: get-chat-history
    socket.on('get-chat-history', (data) => {
      try {
        const { roomId } = data || {};
        if (roomId) {
          socket.emit('chat-history', {
            messages: getRoomChatHistory(roomId),
          });
        }
      } catch (error) {
        console.error(`[Socket Error] Error in get-chat-history: ${error.message}`);
      }
    });

    // Dedicated Event: send-reaction
    socket.on('send-reaction', (data) => {
      try {
        const { roomId, emoji, username } = data || {};
        if (!roomId || !emoji) return;

        const reaction = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          emoji: String(emoji).trim(),
          username: username ? String(username).trim() : 'Anonymous',
          xOffset: Math.floor(Math.random() * 75) + 10, // 10% to 85%
        };

        // Broadcast reaction to all participants in the room
        io.to(roomId).emit('receive-reaction', reaction);
      } catch (error) {
        console.error(`[Socket Error] Error in send-reaction: ${error.message}`);
      }
    });

    // Dedicated Event: transfer-host (Protected: Host only)
    socket.on('transfer-host', async (data) => {
      try {
        const { roomId, targetUsername, username } = data || {};
        if (!roomId || !targetUsername) {
          return socket.emit('error', {
            success: false,
            message: 'RoomId and targetUsername are required',
          });
        }

        const room = await findRoomByRoomId(roomId);
        if (!room) {
          return socket.emit('error', {
            success: false,
            message: 'Room not found',
          });
        }

        const trimmedUsername = username?.trim();
        const issuerRole = getUserRoleInRoom(room, socket.id, trimmedUsername);

        if (issuerRole !== 'Host') {
          console.warn(`[Socket Warning] Non-host user ${trimmedUsername} attempted transfer-host in room ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only the Host can transfer room ownership.',
          });
        }

        const trimmedTarget = targetUsername.trim();
        if (trimmedTarget.toLowerCase() === trimmedUsername?.toLowerCase()) {
          return socket.emit('error', {
            success: false,
            message: 'You cannot transfer host privileges to yourself.',
          });
        }

        const targetParticipant = room.participants.find(
          (p) => p.username.toLowerCase() === trimmedTarget.toLowerCase()
        );

        if (!targetParticipant) {
          return socket.emit('error', {
            success: false,
            message: 'Target participant not found in room or has disconnected.',
          });
        }

        const oldHostParticipant = room.participants.find(
          (p) => p.role === 'Host' || p.username.toLowerCase() === trimmedUsername?.toLowerCase()
        );

        if (oldHostParticipant) {
          oldHostParticipant.role = 'Participant';
        }

        targetParticipant.role = 'Host';
        room.hostUsername = targetParticipant.username;
        room.hostSocketId = targetParticipant.socketId;

        await room.save();

        console.log(`[Socket] Host transferred in room ${roomId} from ${trimmedUsername} to ${targetParticipant.username}`);

        // Broadcast host-transferred to all participants in the room
        io.to(room.roomId).emit('host-transferred', {
          oldHostUsername: trimmedUsername,
          newHostUsername: targetParticipant.username,
          participants: room.participants,
          room,
        });
      } catch (error) {
        console.error(`[Socket Error] Error in transfer-host: ${error.message}`);
        socket.emit('error', {
          success: false,
          message: 'Failed to transfer host',
        });
      }
    });

    // Event: playback-state (Sent by Host in response to request-playback-state)
    socket.on('playback-state', async (data) => {
      try {
        const { roomId, requesterSocketId, currentVideoId, currentTime, isPlaying } = data || {};
        if (!roomId || !requesterSocketId) return;

        const room = await findRoomByRoomId(roomId);
        if (room) {
          if (currentVideoId) room.currentVideoId = currentVideoId;
          if (typeof currentTime === 'number') room.currentTime = currentTime;
          if (typeof isPlaying === 'boolean') room.isPlaying = isPlaying;
          await room.save();
        }

        // Send live Host playback state to the joining/refreshing participant
        io.to(requesterSocketId).emit('sync-playback-state', {
          currentVideoId: currentVideoId || room?.currentVideoId || '',
          currentTime: typeof currentTime === 'number' ? currentTime : (room?.currentTime || 0),
          isPlaying: typeof isPlaying === 'boolean' ? isPlaying : (room?.isPlaying || false),
        });
      } catch (error) {
        console.error(`[Socket Error] Error in playback-state: ${error.message}`);
      }
    });

    // Event: host-video-change (Protected: Host & Moderator)
    socket.on('host-video-change', async (data) => {
      try {
        const { roomId, username, videoId, currentTime, isPlaying } = data || {};
        if (!roomId || !username || !videoId) return;

        const room = await findRoomByRoomId(roomId);
        if (!room) return;

        const trimmedUsername = username.trim();
        const userRole = getUserRoleInRoom(room, socket.id, trimmedUsername);

        if (!canControlPlayback(userRole)) {
          console.warn(`[Socket Warning] Unauthorized video-change attempt by ${trimmedUsername} (${userRole}) in ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only Host and Moderators can change video.',
          });
        }

        room.currentVideoId = videoId.trim();
        room.currentTime = typeof currentTime === 'number' ? currentTime : 0;
        room.isPlaying = typeof isPlaying === 'boolean' ? isPlaying : true;
        await room.save();

        // Broadcast video-changed to all participants in the room
        socket.to(room.roomId).emit('video-changed', {
          videoId: room.currentVideoId,
          currentTime: room.currentTime,
          isPlaying: room.isPlaying,
        });

        console.log(`[Socket] Video change broadcasted in room ${roomId} to ${videoId} by ${userRole} ${trimmedUsername}`);
      } catch (error) {
        console.error(`[Socket Error] Error in host-video-change: ${error.message}`);
      }
    });

    // Event: host-play (Protected: Host & Moderator)
    socket.on('host-play', async (data) => {
      try {
        const { roomId, username, currentTime } = data || {};
        if (!roomId || !username) return;

        const room = await findRoomByRoomId(roomId);
        if (!room) return;

        const trimmedUsername = username.trim();
        const userRole = getUserRoleInRoom(room, socket.id, trimmedUsername);

        if (!canControlPlayback(userRole)) {
          console.warn(`[Socket Warning] Unauthorized play attempt by ${trimmedUsername} (${userRole}) in ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only Host and Moderators can control playback.',
          });
        }

        room.isPlaying = true;
        if (typeof currentTime === 'number') {
          room.currentTime = currentTime;
        }
        await room.save();

        socket.to(room.roomId).emit('sync-play', { currentTime: room.currentTime });
        console.log(`[Socket] Sync Play broadcasted in room ${roomId} by ${userRole} ${trimmedUsername}`);
      } catch (error) {
        console.error(`[Socket Error] Error in host-play: ${error.message}`);
      }
    });

    // Event: host-pause (Protected: Host & Moderator)
    socket.on('host-pause', async (data) => {
      try {
        const { roomId, username, currentTime } = data || {};
        if (!roomId || !username) return;

        const room = await findRoomByRoomId(roomId);
        if (!room) return;

        const trimmedUsername = username.trim();
        const userRole = getUserRoleInRoom(room, socket.id, trimmedUsername);

        if (!canControlPlayback(userRole)) {
          console.warn(`[Socket Warning] Unauthorized pause attempt by ${trimmedUsername} (${userRole}) in ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only Host and Moderators can control playback.',
          });
        }

        room.isPlaying = false;
        if (typeof currentTime === 'number') {
          room.currentTime = currentTime;
        }
        await room.save();

        socket.to(room.roomId).emit('sync-pause', { currentTime: room.currentTime });
        console.log(`[Socket] Sync Pause broadcasted in room ${roomId} by ${userRole} ${trimmedUsername}`);
      } catch (error) {
        console.error(`[Socket Error] Error in host-pause: ${error.message}`);
      }
    });

    // Event: host-seek (Protected: Host & Moderator)
    socket.on('host-seek', async (data) => {
      try {
        const { roomId, username, currentTime } = data || {};
        if (!roomId || !username || typeof currentTime !== 'number') return;

        const room = await findRoomByRoomId(roomId);
        if (!room) return;

        const trimmedUsername = username.trim();
        const userRole = getUserRoleInRoom(room, socket.id, trimmedUsername);

        if (!canControlPlayback(userRole)) {
          console.warn(`[Socket Warning] Unauthorized seek attempt by ${trimmedUsername} (${userRole}) in ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only Host and Moderators can control playback.',
          });
        }

        room.currentTime = currentTime;
        await room.save();

        socket.to(room.roomId).emit('sync-seek', {
          currentTime,
          isPlaying: room.isPlaying,
        });

        console.log(`[Socket] Sync Seek broadcasted in room ${roomId} to time ${currentTime} by ${userRole} ${trimmedUsername}`);
      } catch (error) {
        console.error(`[Socket Error] Error in host-seek: ${error.message}`);
      }
    });

    // Event: playback-state-update (Heartbeat - Protected: Host & Moderator)
    socket.on('playback-state-update', async (data) => {
      try {
        const { roomId, username, currentTime, isPlaying } = data || {};
        if (!roomId || !username || typeof currentTime !== 'number') return;

        const room = await findRoomByRoomId(roomId);
        if (!room) return;

        const trimmedUsername = username.trim();
        const userRole = getUserRoleInRoom(room, socket.id, trimmedUsername);

        if (!canControlPlayback(userRole)) return;

        room.currentTime = currentTime;
        if (typeof isPlaying === 'boolean') {
          room.isPlaying = isPlaying;
        }
        await room.save();
      } catch (error) {
        console.error(`[Socket Error] Error in playback-state-update: ${error.message}`);
      }
    });

    // Event: assign-role (Protected: Host only)
    socket.on('assign-role', async (data) => {
      try {
        const { roomId, targetUsername, role, username } = data || {};
        if (!roomId || !targetUsername || !role) {
          return socket.emit('error', {
            success: false,
            message: 'RoomId, targetUsername, and role are required',
          });
        }

        const room = await findRoomByRoomId(roomId);
        if (!room) {
          return socket.emit('error', {
            success: false,
            message: 'Room not found',
          });
        }

        const issuerRole = getUserRoleInRoom(room, socket.id, username);

        if (!canAssignRoles(issuerRole)) {
          console.warn(`[Socket Warning] Non-host user attempted assign-role in room ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only Host can assign roles.',
          });
        }

        const normalizedRole = String(role).trim();
        if (normalizedRole !== 'Moderator' && normalizedRole !== 'Participant') {
          return socket.emit('error', {
            success: false,
            message: 'Invalid role. Allowed roles are Moderator or Participant.',
          });
        }

        const targetParticipant = room.participants.find(
          (p) => p.username.toLowerCase() === targetUsername.trim().toLowerCase()
        );

        if (!targetParticipant) {
          return socket.emit('error', {
            success: false,
            message: 'Target participant not found in room',
          });
        }

        if (targetParticipant.role === 'Host') {
          return socket.emit('error', {
            success: false,
            message: 'Host role cannot be changed via assign-role',
          });
        }

        targetParticipant.role = normalizedRole;
        await room.save();

        console.log(`[Socket] Role assigned in room ${roomId}: ${targetParticipant.username} is now ${normalizedRole}`);

        // Broadcast role-assigned to all participants in the room
        io.to(room.roomId).emit('role-assigned', {
          participants: room.participants,
          room,
        });
      } catch (error) {
        console.error(`[Socket Error] Error in assign-role: ${error.message}`);
        socket.emit('error', {
          success: false,
          message: 'Failed to assign role',
        });
      }
    });

    // Event: remove-participant (Protected: Host only)
    socket.on('remove-participant', async (data) => {
      try {
        const { roomId, targetUsername, username } = data || {};
        if (!roomId || !targetUsername) {
          return socket.emit('error', {
            success: false,
            message: 'RoomId and targetUsername are required',
          });
        }

        const room = await findRoomByRoomId(roomId);
        if (!room) {
          return socket.emit('error', {
            success: false,
            message: 'Room not found',
          });
        }

        const issuerRole = getUserRoleInRoom(room, socket.id, username);

        if (!canRemoveParticipant(issuerRole)) {
          console.warn(`[Socket Warning] Non-host user attempted remove-participant in room ${roomId}`);
          return socket.emit('error', {
            success: false,
            message: 'Unauthorized: Only Host can remove participants.',
          });
        }

        const targetIndex = room.participants.findIndex(
          (p) => p.username.toLowerCase() === targetUsername.trim().toLowerCase()
        );

        if (targetIndex === -1) {
          return socket.emit('error', {
            success: false,
            message: 'Participant not found in room',
          });
        }

        const targetParticipant = room.participants[targetIndex];

        if (
          targetParticipant.role === 'Host' ||
          (room.hostUsername && room.hostUsername.toLowerCase() === targetParticipant.username.toLowerCase())
        ) {
          return socket.emit('error', {
            success: false,
            message: 'Host cannot remove themselves from the room.',
          });
        }

        const targetSocketId = targetParticipant.socketId;
        const removedUsername = targetParticipant.username;

        // Remove participant from room array
        room.participants.splice(targetIndex, 1);

        // Add to removedParticipants list to prevent rejoining on refresh
        if (!room.removedParticipants) {
          room.removedParticipants = [];
        }
        const alreadyRemoved = room.removedParticipants.some(
          (u) => u.toLowerCase() === removedUsername.toLowerCase()
        );
        if (!alreadyRemoved) {
          room.removedParticipants.push(removedUsername);
        }

        await room.save();

        console.log(`[Socket] User ${removedUsername} removed from room ${roomId} by Host`);

        // Broadcast participant-removed to all users in the room
        io.to(room.roomId).emit('participant-removed', {
          username: removedUsername,
          participants: room.participants,
          room,
        });

        // Make target socket leave room channel if connected
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(room.roomId);
          }
        }
      } catch (error) {
        console.error(`[Socket Error] Error in remove-participant: ${error.message}`);
        socket.emit('error', {
          success: false,
          message: 'Failed to remove participant',
        });
      }
    });

    // Event: leave-room
    socket.on('leave-room', async () => {
      await handleUserLeave(io, socket);
    });

    // Event: disconnect
    socket.on('disconnect', async () => {
      console.log(`[Socket] User Disconnected: ${socket.id}`);
      await handleUserLeave(io, socket);
    });
  });
};

// Backwards compatibility alias
export const initializeSocketHandlers = initializeSocket;
