import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { errorHandler } from "./helpers/errorHandler";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.set("query parser", "extended");

app.use("/api", router);

app.use(errorHandler);

export default app;
