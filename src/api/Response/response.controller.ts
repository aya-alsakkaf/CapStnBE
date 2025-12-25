import { NextFunction, Request, Response as ExpressResponse } from "express";
import Response from "../../models/response";
import mongoose from "mongoose";
import { customRequestType } from "../../types/http";

const createResponse = async (
  req: Request,
  res: ExpressResponse,
  next: NextFunction
) => {
  try {
    const {
      surveyId,
      startedAt,
      submittedAt,
      durationMs,
      isFlaggedSpam,
      trustImpact,
      answers,
    } = req.body;

    const ownerId = (req as customRequestType).user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const response = await Response.create({
      surveyId: new mongoose.Types.ObjectId(surveyId),
      userId: new mongoose.Types.ObjectId(ownerId),
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
