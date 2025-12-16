import express from "express";
import notFoundHandler from "./middeware/notFoundHandler";
import errorHandling from "./middeware/ErrorHandling";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./database";
import userRouter from "./api/User/user.routers";

const app = express();

dotenv.config();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/media", express.static(path.join(__dirname, "../uploads")));

//routers ...
app.use("/user", userRouter);

app.use(notFoundHandler);
app.use(errorHandling);

const PORT = Number(process.env.PORT) || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
