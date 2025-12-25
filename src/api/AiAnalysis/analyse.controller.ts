import { NextFunction, Request, Response } from "express";
import { OpenAI } from "openai";
import { customRequestType } from "../../types/http";
import AiAnalysis from "../../models/AiAnalysis";
import Survey from "../../models/survey";
import Question from "../../models/question";
import Responses from "../../models/response";
import mongoose from "mongoose";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analysisResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string" },
    surveys: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          surveyId: { type: "string" },
          responseCountUsed: { type: "number" },
          findings: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                description: { type: "string" },
              },
              required: ["title", "description"],
            },
          },
          insights: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                theme: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                examples: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["theme", "title", "description", "examples"],
            },
          },
          correlations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                description: { type: "string" },
                evidence: { type: "string" },
              },
              required: ["description", "evidence"],
            },
          },
          caveats: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "surveyId",
          "responseCountUsed",
          "findings",
          "insights",
          "correlations",
          "caveats",
        ],
      },
    },
    dataQualityNotes: {
      type: "object",
      additionalProperties: false,
      properties: {
        confidenceScore: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },
        confidenceExplanation: { type: "string" },
        notes: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["confidenceScore", "confidenceExplanation", "notes"],
    },
  },
  required: ["overview", "surveys", "dataQualityNotes"],
} as const;

const analysisPrompt = `You are a research analyst.

Interpret the survey data provided in the input.

Data rules:
- Responses are index-aligned across questions. For any index i, all responses at index i belong to the same respondent.
- An empty string "" represents a missing answer and must be ignored.
- surveyId defines which questions belong to which survey.
- Use only the provided data. Do not invent numbers, percentages, or statistics.

Task:
- Produce a structured summary of the survey results.
- In the overview, explicitly state how many responses were considered out of the total responseCount (e.g., "3 out of 5 responses were used") so omitted responses are clear.
- Identify key findings from multiple-choice and numeric questions.
- Extract insights from short-text answers.
- Use the term "insights" (not "themes"). Each insight must include a "theme" field.
- Mention correlations only when supported by index alignment.
- Keep the output concise, clear, and suitable for UI rendering.

Confidence rules:
- Provide an overall confidenceScore between 0 and 1 for the entire analysis.
- The confidenceScore must reflect sample size, missing answers, and consistency of patterns.
- Always include a short confidenceExplanation justifying the score.
- Do not inflate confidence when responseCount is small or when many answers are missing.
- confidenceScore represents relative confidence in this analysis, not statistical significance.
- confidenceScore must be consistent with caveats and dataQualityNotes.

Optional fields:
- responseCountUsed: If you cannot determine the exact count of valid responses used, return 0.
- correlations: Return an empty array [] if no correlations are supported by index alignment.
- caveats: Return an empty array [] if there are no caveats or limitations to note.
- examples: Within each insight, return an empty array [] if there are no example responses to include.

Grounding & fidelity rules:
- Evaluate short-text responses relative to the question being asked. Do not treat concise answers as low-information if they appropriately address the question.
- Consider a response low-information only if it is non-responsive, placeholder-like, or fails to meaningfully address the question (e.g., "test", "ok", ".", repeated tokens).
- Do not fabricate response content. Any example in insights.examples must be copied verbatim from the provided responsesByQuestion arrays.
- If a field would require invented content, leave it empty instead of guessing.
- Do not invent question or survey identifiers. surveys[].surveyId in the output must match one of the input surveys[].surveyId values.
- Do not refer to questions by invented IDs. Prefer using the question text when referencing questions.
- Avoid strong claims like "preference" or "trend" when responseCountUsed is small or when answers are repetitive or low-information.
- If repetition appears at scale (many respondents with identical or near-identical answers across multiple questions), include it as an insight and also mention it in dataQualityNotes. Describe it as an observed pattern and quantify it when possible.
- Every finding and insight must be directly supported by observable patterns in the provided data. If support is weak or ambiguous, state the limitation explicitly.
- If the provided data is insufficient to fulfill a task requirement, explicitly state the limitation instead of inferring or extrapolating.

Output rules:
- Return JSON only.
- The output must strictly match the provided JSON Schema.
- Do not include any extra keys or explanatory text outside the JSON.
`;

// Function to fetch and transform survey data for AI
const fetchAndTransformSurveyData = async (
  surveyIds: string[]
): Promise<any> => {
  // Convert string IDs to ObjectIds for MongoDB query
  // Convert string IDs to ObjectIds for MongoDB query
  const surveyObjectIds = surveyIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // 1. Fetch surveys
  const surveys = await Survey.find({
    _id: { $in: surveyObjectIds },
  }).select("_id title description");

  if (surveys.length === 0) {
    throw new Error("No surveys found with the provided IDs");
  }

  // 2. Fetch all questions for these surveys
  const questions = await Question.find({
    surveyId: { $in: surveyObjectIds },
  })
    .select("_id text type options surveyId order")
    .sort({ order: 1 });

  if (questions.length === 0) {
    throw new Error("No questions found for the provided surveys");
  }

  // 3. Fetch all responses for these surveys
  const responses = await Responses.find({
    surveyId: { $in: surveyObjectIds },
    isFlaggedSpam: { $ne: true },
  }).select("surveyId userId answers submittedAt");

  // Create short ID mappings
  const surveyIdMap = new Map<string, string>(); // realId -> shortId
  const questionIdMap = new Map<string, string>(); // realId -> shortId
  const reverseSurveyIdMap = new Map<string, string>(); // shortId -> realId
  const reverseQuestionIdMap = new Map<string, string>(); // shortId -> realId

  // Map surveys to short IDs (s1, s2, s3, ...)
  surveys.forEach((survey, index) => {
    const shortId = `s${index + 1}`;
    const realId = survey._id.toString();
    surveyIdMap.set(realId, shortId);
    reverseSurveyIdMap.set(shortId, realId);
  });

  // Map questions to short IDs (q1, q2, q3, ...)
  questions.forEach((question, index) => {
    const shortId = `q${index + 1}`;
    const realId = question._id.toString();
    questionIdMap.set(realId, shortId);
    reverseQuestionIdMap.set(shortId, realId);
  });

  // 4. Transform surveys to the format with short IDs
  const surveysFormatted = surveys.map((survey) => ({
    surveyId: surveyIdMap.get(survey._id.toString())!,
    title: survey.title,
    description: survey.description || "",
  }));

  // 5. Transform questions to the format with short IDs
  const questionsFormatted = questions.map((question) => ({
    questionId: questionIdMap.get(question._id.toString())!,
    surveyId: surveyIdMap.get(question.surveyId.toString())!,
    question: question.text,
    type: mapQuestionType(question.type),
    options: question.options || [],
  }));

  // 6. Build responsesByQuestion structure with proper alignment
  const userResponsesMap = new Map<string, Map<string, any>>();

  responses.forEach((response) => {
    const userId = response.userId.toString();
    const surveyId = response.surveyId.toString();

    if (!userResponsesMap.has(userId)) {
      userResponsesMap.set(userId, new Map());
    }

    const userSurveyMap = userResponsesMap.get(userId)!;

    if (
      !userSurveyMap.has(surveyId) ||
      response.submittedAt > userSurveyMap.get(surveyId)?.submittedAt
    ) {
      userSurveyMap.set(surveyId, response);
    }
  });

  const userIds = Array.from(userResponsesMap.keys());
  const responseCount = userIds.length;

  // Create a map: questionId -> array of values (index-aligned)
  const responsesByQuestion: { [key: string]: string[] } = {};

  // Initialize arrays for each question with empty strings (using short IDs)
  questionsFormatted.forEach((q) => {
    responsesByQuestion[q.questionId] = new Array(responseCount).fill("");
  });

  // Fill in the responses, aligned by user index (using short question IDs)
  userIds.forEach((userId, userIndex) => {
    const userSurveyMap = userResponsesMap.get(userId)!;

    userSurveyMap.forEach((response) => {
      response.answers.forEach((answer) => {
        const realQuestionId = answer.questionId.toString();
        const shortQuestionId = questionIdMap.get(realQuestionId);

        // Check if this question is in our questions list
        if (shortQuestionId && responsesByQuestion[shortQuestionId]) {
          const value = answer.value || "";
          responsesByQuestion[shortQuestionId][userIndex] = value;
        }
      });
    });
  });

  // 7. Build the final structure
  const result = {
    surveys: surveysFormatted,
    questions: questionsFormatted,
    responseAlignment: {
      type: "index",
      definition:
        'Index i refers to the same respondent across all questions. Empty string "" means missing answer.',
    },
    responsesByQuestion: responsesByQuestion,
    responseCount: responseCount,
    // Include reverse maps for converting back to real IDs
    reverseSurveyIdMap: Object.fromEntries(reverseSurveyIdMap),
    reverseQuestionIdMap: Object.fromEntries(reverseQuestionIdMap),
  };

  console.log("Transformed survey data:", JSON.stringify(result, null, 2));

  return result;
};

// Helper function to map your DB question types to AI format
const mapQuestionType = (dbType: string): string => {
  const typeMap: { [key: string]: string } = {
    text: "short-text",
    multiple_choice: "mcq",
    single_choice: "mcq",
    dropdown: "mcq",
    checkbox: "mcq",
  };
  return typeMap[dbType] || "short-text";
};

// Function to convert short IDs back to real IDs in AI response
const convertShortIdsToRealIds = (
  aiResponse: any,
  reverseSurveyMap: { [key: string]: string },
  reverseQuestionMap: { [key: string]: string }
) => {
  // Clone the response to avoid mutation
  const converted = JSON.parse(JSON.stringify(aiResponse));

  // Convert survey IDs in the surveys array
  if (converted.surveys && Array.isArray(converted.surveys)) {
    converted.surveys = converted.surveys.map((survey: any) => ({
      ...survey,
      surveyId: reverseSurveyMap[survey.surveyId] || survey.surveyId,
    }));
  }

  return converted;
};

const testAI = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("=== AI Test Started ===");
    console.log("Sending hello to OpenAI...");

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that responds in JSON format.",
        },
        {
          role: "user",
          content: "add data for cars",
        },
      ],
      temperature: 0,
      seed: 42,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "survey_analysis_response",
          strict: true,
          schema: analysisResponseSchema,
        },
      },
    });

    const response = completion.choices[0]?.message?.content;
    console.log("=== OpenAI Response ===");
    console.log(JSON.stringify(JSON.parse(response as string), null, 2));
    console.log("=== End of Response ===");

    res.status(200).json({
      message: "AI test successful - check console for output",
      response: JSON.parse(response || "{}"),
    });
  } catch (error) {
    console.error("=== AI Test Error ===");
    console.error(error);
    next(error);
  }
};

const analyzeSurveyData = async (
  surveyData: any,
  analysisId: string
): Promise<any> => {
  try {
    // Update progress: Starting analysis (10%)
    await AiAnalysis.findByIdAndUpdate(analysisId, { progress: 10 });

    console.log("=== Survey Analysis Started ===");
    console.log("Survey data received:", JSON.stringify(surveyData, null, 2));

    // Update progress: Preparing request (20%)
    await AiAnalysis.findByIdAndUpdate(analysisId, { progress: 20 });

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: [
        {
          role: "system",
          content: analysisPrompt,
        },
        {
          role: "user",
          content: `Analyze the following survey data:\n\n${JSON.stringify(
            surveyData,
            null,
            2
          )}`,
        },
      ],
      temperature: 0,
      seed: 42,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "survey_analysis_response",
          strict: true,
          schema: analysisResponseSchema,
        },
      },
    });

    // Update progress: Processing response (70%)
    await AiAnalysis.findByIdAndUpdate(analysisId, { progress: 70 });

    const response = completion.choices[0]?.message?.content;
    const parsedResponse = JSON.parse(response || "{}");

    // Convert short IDs back to real IDs
    const convertedResponse = convertShortIdsToRealIds(
      parsedResponse,
      surveyData.reverseSurveyIdMap,
      surveyData.reverseQuestionIdMap
    );

    // Update progress: Finalizing (90%)
    await AiAnalysis.findByIdAndUpdate(analysisId, { progress: 90 });

    console.log("=== OpenAI Analysis Response (with real IDs) ===");
    console.log(JSON.stringify(convertedResponse, null, 2));
    console.log("=== End of Response ===");

    return convertedResponse;
  } catch (error) {
    console.error("Error in analyzeSurveyData:", error);
    throw error;
  }
};

// New endpoint handler with authentication
const createAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customReq = req as customRequestType;
    const ownerId = customReq.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { surveyIds } = req.body;

    // Validation
    if (!surveyIds) {
      return res.status(400).json({
        message: "surveyIds are required",
      });
    }

    // Normalize surveyIds: accept both single ID (string) or array
    let normalizedSurveyIds: string[];
    if (Array.isArray(surveyIds)) {
      if (surveyIds.length === 0) {
        return res.status(400).json({
          message: "surveyIds array cannot be empty",
        });
      }
      normalizedSurveyIds = surveyIds;
    } else if (typeof surveyIds === "string") {
      // Single ID provided as string
      normalizedSurveyIds = [surveyIds];
    } else {
      return res.status(400).json({
        message: "surveyIds must be a string or an array of strings",
      });
    }

    // Auto-determine type based on number of survey IDs
    const type = normalizedSurveyIds.length === 1 ? "single" : "multi";

    // Fetch and transform survey data from database
    let surveyData;
    try {
      surveyData = await fetchAndTransformSurveyData(normalizedSurveyIds);
      console.log(
        "Survey data transformed:",
        JSON.stringify(surveyData, null, 2)
      );
    } catch (error) {
      console.error("Error fetching survey data:", error);
      return res.status(500).json({
        message: "Failed to fetch survey data from database",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Convert string IDs to ObjectIds for MongoDB
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    const surveyObjectIds = normalizedSurveyIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Create AiAnalysis document with status "processing"
    const aiAnalysis = await AiAnalysis.create({
      ownerId: ownerObjectId,
      surveyIds: surveyObjectIds,
      type,
      status: "processing",
      progress: 0,
      idMapping: {
        surveys: surveyData.reverseSurveyIdMap,
        questions: surveyData.reverseQuestionIdMap,
      },
      data: {
        overview: "Analysis in progress...",
        surveys: [],
        dataQualityNotes: {
          confidenceScore: 0,
          confidenceExplanation: "Analysis pending completion...",
          notes: [],
        },
      },
    });

    if (!aiAnalysis) {
      return res.status(500).json({ message: "Failed to create analysis" });
    }

    // Return immediately with processing status
    res.status(202).json({
      message: "Analysis started",
      analysisId: aiAnalysis._id,
      status: "processing",
      progress: 0,
      type: type,
    });

    // Process analysis in background
    analyzeSurveyData(surveyData, aiAnalysis._id.toString())
      .then(async (analysisResult) => {
        // Update with successful results (100% progress)
        await AiAnalysis.findByIdAndUpdate(
          aiAnalysis._id,
          {
            status: "ready",
            progress: 100,
            data: analysisResult,
          },
          { new: true }
        );
        console.log("Analysis completed successfully:", aiAnalysis._id);
      })
      .catch(async (error) => {
        console.error("Analysis failed:", error);
        // Update status to failed
        await AiAnalysis.findByIdAndUpdate(aiAnalysis._id, {
          status: "failed",
          progress: 0,
        });
      });
  } catch (error) {
    console.error("=== Create Analysis Error ===");
    console.error(error);
    next(error);
  }
};

// New endpoint to get analysis status and progress
const getAnalysisStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customReq = req as customRequestType;
    const ownerId = customReq.user?.id;
    const { analysisId } = req.params;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!analysisId) {
      return res.status(400).json({ message: "analysisId is required" });
    }

    const analysis = await AiAnalysis.findOne({
      _id: new mongoose.Types.ObjectId(analysisId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    res.status(200).json({
      analysisId: analysis._id,
      surveyIds: analysis.surveyIds,
      type: analysis.type,
      status: analysis.status,
      progress: analysis.progress,
      data: analysis.status === "ready" ? analysis.data : null,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    });
  } catch (error) {
    console.error("=== Get Analysis Status Error ===");
    console.error(error);
    next(error);
  }
};

// Get all analyses for the authenticated user
const getAllAnalyses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customReq = req as customRequestType;
    const ownerId = customReq.user?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const analyses = await AiAnalysis.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      message: "Analyses fetched successfully",
      analyses: analyses.map((analysis) => ({
        analysisId: analysis._id,
        surveyIds: analysis.surveyIds,
        type: analysis.type,
        status: analysis.status,
        progress: analysis.progress,
        data: analysis.status === "ready" ? analysis.data : null,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      })),
      count: analyses.length,
    });
  } catch (error) {
    console.error("=== Get All Analyses Error ===");
    console.error(error);
    next(error);
  }
};

export {
  testAI,
  analyzeSurveyData,
  createAnalysis,
  getAnalysisStatus,
  getAllAnalyses,
};
