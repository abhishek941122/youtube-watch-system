import mongoose from 'mongoose';

/**
 * User Schema Placeholder for Phase 1
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['host', 'moderator', 'participant'],
      default: 'participant',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
