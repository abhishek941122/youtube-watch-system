import Room from '../models/Room.js';

/**
 * Helper function to find a room document by its roomId
 * @param {string} roomId
 * @returns {Promise<Document|null>}
 */
export const findRoomByRoomId = async (roomId) => {
  if (!roomId) return null;
  return await Room.findOne({ roomId: roomId.toUpperCase() });
};
