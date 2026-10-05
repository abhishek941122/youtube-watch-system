import React, { createContext, useContext, useState } from 'react';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userRole, setUserRole] = useState('participant');

  const value = {
    currentRoom,
    setCurrentRoom,
    userRole,
    setUserRole,
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};
