import { Router } from "express";
import * as DashboardController from "../controllers/DashboardController";

const router = Router();

router.get("/summary", DashboardController.getSummary);

export default router;
