import { Router } from "express";
import {
  createResponse,
  getResponseById,
  updateResponse,
  deleteResponse,
  getResponsesBySurveyId,
  getResponsesByUserId,
  getResponses,
} from "./response.controller";

const responseRouter = Router();

responseRouter.post("/", createResponse);
responseRouter.get("/:id", getResponseById);
responseRouter.put("/:id", updateResponse);
responseRouter.delete("/:id", deleteResponse);
responseRouter.get("/survey/:surveyId", getResponsesBySurveyId);
responseRouter.get("/user/:userId", getResponsesByUserId);
responseRouter.get("/", getResponses);

export default responseRouter;
