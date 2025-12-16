import { Router } from "express";
import {
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySurveyId,
  getQuestions,
} from "./question.controller";
const questionRouter = Router();

questionRouter.post("/", createQuestion);
questionRouter.get("/:id", getQuestionById);
questionRouter.put("/:id", updateQuestion);
questionRouter.delete("/:id", deleteQuestion);
questionRouter.get("/survey/:surveyId", getQuestionsBySurveyId);
questionRouter.get("/", getQuestions);

export default questionRouter;
