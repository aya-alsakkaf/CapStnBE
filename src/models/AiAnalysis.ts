import { model, Schema } from "mongoose";

const insightSchema = new Schema(
  {
    theme: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    examples: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const findingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const correlationSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    evidence: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const surveySummarySchema = new Schema(
  {
    surveyId: {
      type: String,
      required: true,
    },
    responseCountUsed: {
      type: Number,
    },
    findings: {
      type: [findingSchema],
      default: [],
    },
    insights: {
      type: [insightSchema],
      default: [],
    },
    correlations: {
      type: [correlationSchema],
      default: [],
    },
    caveats: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const dataQualitySchema = new Schema(
  {
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    confidenceExplanation: {
      type: String,
      required: true,
    },
    notes: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const dataSchema = new Schema(
  {
    overview: {
      type: String,
      required: true,
    },
    surveys: {
      type: [surveySummarySchema],
      default: [],
    },
    dataQualityNotes: {
      type: dataQualitySchema,
      required: true,
    },
  },
  { _id: false }
);

const aiAnalysisSchema = new Schema(
  {
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

    data: {
      type: dataSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AiAnalysis = model("AiAnalysis", aiAnalysisSchema);

export default AiAnalysis;
