import { Router } from "express";
import {
  createSurvey,
  getSurveyById,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  unpublishSurvey,
  getPublishedSurveys,
  getUnpublishedSurveys,
  getSurveys,
  getSurveysByCreatorId,
  getSurveyByTitle,
} from "./survey.controller";

const surveyRouter = Router();

surveyRouter.post("/", createSurvey);
surveyRouter.get("/:id", getSurveyById);
surveyRouter.put("/:id", updateSurvey);
surveyRouter.delete("/:id", deleteSurvey);
surveyRouter.post("/publish/:id", publishSurvey);
surveyRouter.post("/unpublish/:id", unpublishSurvey);
surveyRouter.get("/published", getPublishedSurveys);
surveyRouter.get("/unpublished", getUnpublishedSurveys);

export default surveyRouter;
