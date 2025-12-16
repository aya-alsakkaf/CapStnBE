import { NextFunction, Request, Response } from "express";
import { OpenAI } from "openai";

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

Optional fields (return empty/default values if not applicable):
- responseCountUsed: Return 0 if you cannot determine the exact count of valid responses used.
- correlations: Return an empty array [] if there are no correlations supported by index alignment.
- caveats: Return an empty array [] if there are no caveats or limitations to note.
- examples: Within each insight, return an empty array [] if there are no example responses to include.

All other fields are required and must have actual values (not empty).

Output rules:
- Return JSON only.
- The output must strictly match the provided JSON Schema.
- Do not include any extra keys or explanatory text outside the JSON.
`;

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
          content:
            "Say hello and tell me you are ready to analyze survey data in the overview. and fillout the rest of the properties",
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

const analyzeSurveyData = async (surveyData: any): Promise<any> => {
  console.log("=== Survey Analysis Started ===");
  console.log("Survey data received:", JSON.stringify(surveyData, null, 2));

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

  const response = completion.choices[0]?.message?.content;
  const parsedResponse = JSON.parse(response || "{}");

  console.log("=== OpenAI Analysis Response ===");
  console.log(JSON.stringify(parsedResponse, null, 2));
  console.log("=== End of Response ===");

  return parsedResponse;
};

export { testAI };
