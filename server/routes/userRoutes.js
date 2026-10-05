import express from 'express';
import { getUserProfile, updateUserRole } from '../controllers/userController.js';

const router = express.Router();

// Placeholder user routes
router.get('/profile', getUserProfile);
router.put('/role', updateUserRole);

export default router;
