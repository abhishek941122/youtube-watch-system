export const generateRandomRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const saveUserData = (username, roomId) => {
  if (username) localStorage.setItem('username', username.trim());
  if (roomId) localStorage.setItem('roomId', roomId.trim());
};

export const getUserData = () => ({
  username: localStorage.getItem('username') || '',
  roomId: localStorage.getItem('roomId') || '',
});

/**
 * Extract YouTube Video ID from URL or return video ID if valid format
 */
export const extractYouTubeId = (input) => {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Direct 11-character video ID match
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex matching various YouTube URL formats
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  return match && match[1] ? match[1] : null;
};