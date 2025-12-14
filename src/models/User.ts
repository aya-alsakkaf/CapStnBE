import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
