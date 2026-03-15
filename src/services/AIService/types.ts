import z from "zod";
import { aiParseTargetSchema } from "../../schemas/ai";

export type ParseTarget = z.infer<typeof aiParseTargetSchema>;
