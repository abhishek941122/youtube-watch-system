import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Host', 'Moderator', 'Participant'],
      default: 'Participant',
    },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hostSocketId: {
      type: String,
      required: true,
    },
    hostUsername: {
      type: String,
      default: '',
      trim: true,
    },
    currentVideoId: {
      type: String,
      default: '',
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    isPlaying: {
      type: Boolean,
      default: false,
    },
    participants: [participantSchema],
    removedParticipants: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

export default Room;
