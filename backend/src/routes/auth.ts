import { Router } from "express";
import { loginSchema } from "@engineering-data-normalizer/shared";
import * as AuthController from "../controllers/AuthController";
import {
  authTokensHandler,
  getUserByToken,
  requireAuth,
} from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);

router.get(
  "/me",
  authTokensHandler,
  getUserByToken,
  requireAuth,
  AuthController.getMe,
);

export default router;
