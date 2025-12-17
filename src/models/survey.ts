import mongoose, { Schema, model } from "mongoose";

const surveySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    rewardPoints: {
      type: Number,
      required: true,
    },
    estimatedMinutes: {
      type: Number,
      required: true,
    },
    draft: {
      type: String,
      enum: ["published", "unpublished"],
      default: "unpublished",
      required: true,
    },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Survey = mongoose.model("Survey", surveySchema);

export default Survey;
