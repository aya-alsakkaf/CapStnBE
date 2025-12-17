import { NextFunction, Request, Response as ExpressResponse } from "express";
import Response from "../../models/Response";

const createResponse = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const {
      surveyId,
      userId,
      startedAt,
      submittedAt,
      durationMs,
      isFlaggedSpam,
      trustImpact,
      answers,
    } = req.body;
    const response = await Response.create({
      surveyId,
      userId,
      startedAt,
      submittedAt,
      durationMs,
      isFlaggedSpam,
      trustImpact,
      answers,
    });
    res
      .status(201)
      .json({ message: "Response created successfully", response });
  } catch (error) {
    next(error);
  }
};

const getResponseById = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const response = await Response.findById(id);
    res
      .status(200)
      .json({ message: "Response fetched successfully", response });
  } catch (error) {
    next(error);
  }
};

const updateResponse = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      surveyId,
      userId,
      startedAt,
      submittedAt,
      durationMs,
      isFlaggedSpam,
      trustImpact,
      answers,
    } = req.body;
    const response = await Response.findByIdAndUpdate(id, {
      surveyId,
      userId,
      startedAt,
      submittedAt,
      durationMs,
      isFlaggedSpam,
      trustImpact,
      answers,
    });
    res
      .status(200)
      .json({ message: "Response updated successfully", response });
  } catch (error) {
    next(error);
  }
};

const deleteResponse = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await Response.findByIdAndDelete(id);
    res.status(200).json({ message: "Response deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getResponsesBySurveyId = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const { surveyId } = req.params;
    const responses = await Response.find({ surveyId });
    res
      .status(200)
      .json({ message: "Responses fetched successfully", responses });
  } catch (error) {
    next(error);
  }
};

const getResponsesByUserId = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const responses = await Response.find({ userId });
    res
      .status(200)
      .json({ message: "Responses fetched successfully", responses });
  } catch (error) {
    next(error);
  }
};

const getResponses = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const responses = await Response.find();
    res
      .status(200)
      .json({ message: "Responses fetched successfully", responses });
  } catch (error) {
    next(error);
  }
};

export {
  createResponse,
  getResponseById,
  updateResponse,
  deleteResponse,
  getResponsesBySurveyId,
  getResponsesByUserId,
  getResponses,
};
