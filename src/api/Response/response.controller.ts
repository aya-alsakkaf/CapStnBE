import { NextFunction, Request, Response as ExpressResponse } from "express";
import Responses from "../../models/Response";

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
    const response = await Responses.create({
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
    const response = await Responses.findById(id);
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
    const response = await Responses.findByIdAndUpdate(id, {
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
    await Responses.findByIdAndDelete(id);
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
    const responses = await Responses.find({ surveyId });
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
    const responses = await Responses.find({ userId });
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
    const responses = await Responses.find();
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
