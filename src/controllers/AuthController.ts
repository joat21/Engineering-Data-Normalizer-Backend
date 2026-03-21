import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../prisma/prisma";
import { loginSchema } from "../schemas/auth";
import { HandlerFromSchema } from "../types/zod";
import { signToken } from "../helpers/tokens";
import { cookieOptions } from "../config";

export const login: HandlerFromSchema<typeof loginSchema> = async (
  req,
  res,
  next,
) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Неправильный логин или пароль" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Неправильный логин или пароль" });
    }

    const accessToken = signToken(
      { id: user.id },
      process.env.JWT_ACCESS_SECRET!,
      "15m",
    );
    const refreshToken = signToken(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      "7d",
    );

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...rest } = user;

    res.json(rest);
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (_req, res, next) => {
  try {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      res.sendStatus(401);
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};
