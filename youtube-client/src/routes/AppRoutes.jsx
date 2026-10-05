import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout.jsx';
import HomePage from '../pages/HomePage.jsx';
import JoinRoomPage from '../pages/JoinRoomPage.jsx';
import RoomPage from '../pages/RoomPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="join" element={<JoinRoomPage />} />
        <Route path="room/:roomId" element={<RoomPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
