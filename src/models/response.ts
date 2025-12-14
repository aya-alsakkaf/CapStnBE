import mongoose, { Schema, model } from "mongoose";

const answerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  value: { type: String, required: true },
});

const responseSchema = new Schema({
  surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, required: true },
  durationMs: { type: Number },
  isFlaggedSpam: { type: Boolean, default: false },
  trustImpact: { type: Number },
  answers: {
    type: [answerSchema],
    required: true,
  },
});

const Response = mongoose.model("Response", responseSchema);

export default Response;
