import { User } from "../generated/prisma/client";

declare global {
  namespace Express {
    export interface Request {
      user?: Omit<User, "passwordHash">;
    }
  }
}
