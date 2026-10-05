export const APP_NAME = 'YouTube Watch Party';

export const ROOM_ROLES = {
  HOST: 'Host',
  MODERATOR: 'Moderator',
  PARTICIPANT: 'Participant',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
