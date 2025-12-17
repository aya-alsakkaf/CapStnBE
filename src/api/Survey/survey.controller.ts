import { NextFunction, Request, Response } from "express";
import Survey from "../../models/Survey";

const createSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, rewardPoints, estimatedMinutes, draft } = req.body;
    const survey = await Survey.create({
      title,
      description,
      rewardPoints,
      estimatedMinutes,
      draft,
    });

    res.status(201).json({ message: "Survey created successfully", survey });
  } catch (error) {
    next(error);
  }
};

const getSurveyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id);
    res.status(200).json({ message: "Survey fetched successfully", survey });
  } catch (error) {
    next(error);
  }
};

const updateSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, rewardPoints, estimatedMinutes } = req.body;
    const survey = await Survey.findByIdAndUpdate(id, {
      title,
      description,
      rewardPoints,
      estimatedMinutes,
    });
    res.status(200).json({ message: "Survey updated successfully", survey });
  } catch (error) {
    next(error);
  }
};

const deleteSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await Survey.findByIdAndDelete(id);
    res.status(200).json({ message: "Survey deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getSurveys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const surveys = await Survey.find();
    res.status(200).json({ message: "Surveys fetched successfully", surveys });
  } catch (error) {
    next(error);
  }
};

const getSurveysByCreatorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { creatorId } = req.params;
    const surveys = await Survey.find({ creatorId });
    res.status(200).json({ message: "Surveys fetched successfully", surveys });
  } catch (error) {
    next(error);
  }
};

const publishSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findByIdAndUpdate(id, { draft: "published" });
    res.status(200).json({ message: "Survey published successfully", survey });
  } catch (error) {
    next(error);
  }
};

const unpublishSurvey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findByIdAndUpdate(id, { draft: "unpublished" });
    res
      .status(200)
      .json({ message: "Survey unpublished successfully", survey });
  } catch (error) {
    next(error);
  }
};

const getPublishedSurveys = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const surveys = await Survey.find({ draft: "published" });
    res
      .status(200)
      .json({ message: "Published surveys fetched successfully", surveys });
  } catch (error) {
    next(error);
  }
};

const getUnpublishedSurveys = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const surveys = await Survey.find({ draft: "unpublished" });
    res
      .status(200)
      .json({ message: "Unpublished surveys fetched successfully", surveys });
  } catch (error) {
    next(error);
  }
};

const getSurveyByTitle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = req.params;
    const survey = await Survey.findOne({ title });
    res.status(200).json({ message: "Survey fetched successfully", survey });
  } catch (error) {
    next(error);
  }
};

export {
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
};
