import { Router } from "express";
import * as CategoryController from "../controllers/CategoryController";

const router = Router();

router.get("/", CategoryController.getAll);

export default router;
