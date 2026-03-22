import { z } from "zod";
import { loginSchema } from "../schemas/auth";

export type LoginInput = z.infer<typeof loginSchema.shape.body>;
