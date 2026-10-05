import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Create room API call
 */
export const createRoomApi = async (username, socketId) => {
  const response = await api.post('/rooms/create', {
    username,
    hostSocketId: socketId || `temp_${Date.now()}`,
  });
  return response.data;
};

/**
 * Join room API call
 */
export const joinRoomApi = async (roomId, username, socketId) => {
  const response = await api.post('/rooms/join', {
    roomId,
    username,
    socketId: socketId || `temp_${Date.now()}`,
  });
  return response.data;
};

/**
 * Get room details by roomId API call
 */
export const getRoomApi = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

/**
 * Update room video ID API call
 */
export const updateRoomVideoApi = async (roomId, videoId) => {
  const response = await api.patch(`/rooms/${roomId}/video`, {
    videoId,
  });
  return response.data;
};

export default api;