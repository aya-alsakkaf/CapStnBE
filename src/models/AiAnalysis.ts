import { model, Schema } from "mongoose";

const insightSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

const aiAnalysisSchema = new Schema({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  surveyIds: {
    type: [Schema.Types.ObjectId],
    ref: "Survey",
    required: true,
  },
  type: {
    type: String,
    enum: ["single", "multi"],
    required: true,
  },
  status: {
    type: String,
    enum: ["processing", "ready", "failed"],
    required: true,
  },
  summaryText: {
    type: String,
  },
  insights: {
    type: [insightSchema],
  },
});

const AiAnalysis = model("AiAnalysis", aiAnalysisSchema);

export default AiAnalysis;
