import { NextFunction, Request, Response } from "express";
import Question from "../../models/question";

const createQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { surveyId, order, text, type, options, isRequired } = req.body;
    const question = await Question.create({
      surveyId,
      order,
      text,
      type,
      options,
      isRequired,
    });
    res
      .status(201)
      .json({ message: "Question created successfully", question });
  } catch (error) {
    next(error);
  }
};

const getQuestionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    res
      .status(200)
      .json({ message: "Question fetched successfully", question });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { surveyId, order, text, type, options, isRequired } = req.body;
    const question = await Question.findByIdAndUpdate(id, {
      surveyId,
      order,
      text,
      type,
      options,
      isRequired,
    });
    res
      .status(200)
      .json({ message: "Question updated successfully", question });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await Question.findByIdAndDelete(id);
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getQuestionsBySurveyId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { surveyId } = req.params;
    const questions = await Question.find({ surveyId });
    res
      .status(200)
      .json({ message: "Questions fetched successfully", questions });
  } catch (error) {
    next(error);
  }
};

const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const questions = await Question.find();
    res
      .status(200)
      .json({ message: "Questions fetched successfully", questions });
  } catch (error) {
    next(error);
  }
};

export {
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySurveyId,
  getQuestions,
};
