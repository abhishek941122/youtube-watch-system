/**
 * Server constants
 */

export const ROLES = {
  HOST: 'host',
  MODERATOR: 'moderator',
  PARTICIPANT: 'participant',
};

export const SOCKET_EVENTS = {
  CONNECT: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SYNC_PLAYBACK: 'sync_playback',
};
