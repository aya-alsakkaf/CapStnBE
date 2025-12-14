import mongoose, { Schema, model } from "mongoose";

const modelSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  streakDays: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  trustScore: {
    type: Number,
    default: 50,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", modelSchema);

export default User;
