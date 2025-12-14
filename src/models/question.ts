import mongoose, { Schema, model } from "mongoose";

const questionSchema = new Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "multiple_choice",
        "single_choice",
        "dropdown",
        "checkbox",
      ],
      required: true,
    },
    options: {
      type: [String],
    },
    isRequired: {
      type: Boolean,
      required: true,
    },
    surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
