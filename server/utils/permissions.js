/**
 * Permission Utility Functions for YouTube Watch Party
 */

/**
 * Check if a role can control video playback (Play, Pause, Seek, Change Video)
 * Host: Yes | Moderator: Yes | Participant: No
 * @param {string} role 
 * @returns {boolean}
 */
export const canControlPlayback = (role) => {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase();
  return normalized === 'host' || normalized === 'moderator';
};

/**
 * Check if a role can assign roles (Promote Moderator / Demote Participant)
 * Host: Yes | Moderator: No | Participant: No
 * @param {string} role 
 * @returns {boolean}
 */
export const canAssignRoles = (role) => {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase();
  return normalized === 'host';
};

/**
 * Check if a role can remove a participant from the room
 * Host: Yes | Moderator: No | Participant: No
 * @param {string} role 
 * @returns {boolean}
 */
export const canRemoveParticipant = (role) => {
  if (!role) return false;
  const normalized = String(role).trim().toLowerCase();
  return normalized === 'host';
};

/**
 * Helper to get role of a user in a room by socketId or username
 * @param {Object} room 
 * @param {string} socketId 
 * @param {string} username 
 * @returns {string|null}
 */
export const getUserRoleInRoom = (room, socketId, username) => {
  if (!room || !Array.isArray(room.participants)) return null;
  const participant = room.participants.find(
    (item) =>
      (socketId && item.socketId === socketId) ||
      (username && item.username.toLowerCase() === username.trim().toLowerCase())
  );
  return participant ? participant.role : null;
};
