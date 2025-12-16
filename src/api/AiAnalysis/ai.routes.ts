import { Router } from "express";
import { testAI } from "./ai.controller";

const aiRouter = Router();

aiRouter.post("/test", testAI);

export default aiRouter;
