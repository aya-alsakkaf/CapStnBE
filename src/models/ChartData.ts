import { model, Schema } from "mongoose";

// Validator function defined at module level to avoid scope issues
function validateChartData(this: any, value: any) {
  // Access chartType from the parent document (this refers to the chartSchema document)
  const chartType = this.chartType;

  if (!chartType) {
    return true; // Skip validation if chartType is not set yet
  }

  if (chartType === "table") {
    // For table charts, columns and rows are required
    if (!value || !value.columns || value.columns.length === 0) {
      return false;
    }
    if (!value.rows || value.rows.length === 0) {
      return false;
    }
  } else if (["bar", "line", "donut"].includes(chartType)) {
    // For bar/line/donut charts, labels and series are required
    if (!value || !value.labels || value.labels.length === 0) {
      return false;
    }
    if (!value.series || value.series.length === 0) {
      return false;
    }
  }

  return true;
}

const chartDataStructureSchema = new Schema(
  {
    // For bar/line/donut
    labels: { type: [String], default: undefined },

    series: {
      type: [
        new Schema(
          {
            name: { type: String, required: true },
            values: { type: [Number], required: true },
          },
          { _id: false }
        ),
      ],
      default: undefined,
    },

    // For table charts (optional fallback)
    columns: { type: [String], default: undefined },
    rows: { type: [[Schema.Types.Mixed]], default: undefined },

    // Extra metadata for formatting + hints
    meta: {
      type: new Schema(
        {
          unit: { type: String }, // "count" | "percent" | "avg" | etc.
          valueFormat: { type: String }, // "int" | "float" | "percent"
          xType: { type: String }, // "category" | "date"
          notes: { type: String },
        },
        { _id: false }
      ),
      default: undefined,
    },
  },
  { _id: false }
);

const chartSchema = new Schema({
  chartType: {
    type: String,
    enum: ["bar", "line", "donut", "table"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  data: {
    type: chartDataStructureSchema,
    required: true,
    validate: {
      validator: validateChartData,
      message: function (this: any) {
        const chartType = this.chartType;
        if (chartType === "table") {
          return "For table charts, columns and rows are required in data";
        } else {
          return "For bar/line/donut charts, labels and series are required in data";
        }
      },
    },
  },
  sourceQuestionIds: {
    type: [Schema.Types.ObjectId],
    ref: "Question",
  },
});

const chartDataSchema = new Schema(
  {
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "AiAnalysis",
      required: true,
    },
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
    charts: {
      type: [chartSchema],
      required: true,
    },
  },
  { timestamps: true }
);

const ChartData = model("ChartData", chartDataSchema);

export default ChartData;
