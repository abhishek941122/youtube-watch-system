import Room from '../models/Room.js';
import { generateRoomId } from '../utils/generateRoomId.js';
import { findRoomByRoomId } from '../utils/findRoomByRoomId.js';

/**
 * Create a new watch party room
 * POST /api/rooms/create
 */
export const createRoom = async (req, res, next) => {
  try {
    const { username, hostSocketId } = req.body;

    if (!username || !hostSocketId) {
      return res.status(400).json({
        success: false,
        message: 'Username and hostSocketId are required',
      });
    }

    // Generate unique 6-character room code
    let roomId = generateRoomId();
    let existingRoom = await findRoomByRoomId(roomId);

    while (existingRoom) {
      roomId = generateRoomId();
      existingRoom = await findRoomByRoomId(roomId);
    }

    const trimmedUsername = username.trim();

    // Create room with host participant
    const newRoom = await Room.create({
      roomId,
      hostSocketId,
      hostUsername: trimmedUsername,
      participants: [
        {
          socketId: hostSocketId,
          username: trimmedUsername,
          role: 'Host',
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: newRoom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Join an existing watch party room
 * POST /api/rooms/join
 */
export const joinRoom = async (req, res, next) => {
  try {
    const { roomId, username, socketId } = req.body;

    if (!roomId || !username || !socketId) {
      return res.status(400).json({
        success: false,
        message: 'RoomId, username, and socketId are required',
      });
    }

    const room = await findRoomByRoomId(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const trimmedUsername = username.trim();

    // Check if user was removed by host from this room
    const isRemoved =
      Array.isArray(room.removedParticipants) &&
      room.removedParticipants.some(
        (name) => name.toLowerCase() === trimmedUsername.toLowerCase()
      );

    if (isRemoved) {
      return res.status(403).json({
        success: false,
        message: 'You have been removed from this room by the host.',
      });
    }

    // Find if participant with same username already exists
    const existingParticipant = room.participants.find(
      (participant) => participant.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (existingParticipant) {
      existingParticipant.socketId = socketId;
    } else {
      room.participants.push({
        socketId,
        username: trimmedUsername,
        role: 'Participant',
      });
    }

    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Joined room successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get room details by roomId
 * GET /api/rooms/:roomId
 */
export const getRoomByRoomId = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'RoomId parameter is required',
      });
    }

    const room = await findRoomByRoomId(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Room details retrieved successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of participants in a room
 * GET /api/rooms/:roomId/participants
 */
export const getRoomParticipants = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'RoomId parameter is required',
      });
    }

    const room = await findRoomByRoomId(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Participants retrieved successfully',
      data: room.participants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update room video ID
 * PATCH /api/rooms/:roomId/video
 */
export const updateRoomVideo = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { videoId } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'RoomId parameter is required',
      });
    }

    if (videoId === undefined || videoId === null) {
      return res.status(400).json({
        success: false,
        message: 'VideoId is required',
      });
    }

    const room = await findRoomByRoomId(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    room.currentVideoId = String(videoId).trim();
    room.currentTime = 0;
    room.isPlaying = false;
    await room.save();

    return res.status(200).json({
      success: true,
      message: 'Room video updated successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

