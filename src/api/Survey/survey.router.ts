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
import { authorize } from "../../middeware/Authorize";

const surveyRouter = Router();

surveyRouter.get("/published", getPublishedSurveys);
surveyRouter.get("/unpublished", getUnpublishedSurveys);
surveyRouter.get("/:id", getSurveyById);
surveyRouter.put("/:id", updateSurvey);
surveyRouter.delete("/:id", deleteSurvey);
// Protected routes – require a valid JWT so we can set req.user.id as creatorId
surveyRouter.post("/", authorize, createSurvey);
surveyRouter.post("/publish/:id", authorize, publishSurvey);
surveyRouter.post("/unpublish/:id", authorize, unpublishSurvey);

export default surveyRouter;
