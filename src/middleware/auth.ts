import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { verifyAndRefreshTokens } from "../helpers/tokens";
import { prisma } from "../../prisma/prisma";

export const authTokensHandler: RequestHandler = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!accessToken && !refreshToken) {
    next();
    return;
  }

  const isValid = await verifyAndRefreshTokens(req, res);

  if (!isValid) {
    res.sendStatus(401);
    return;
  }

  next();
};

export const getUserByToken: RequestHandler = async (req, _res, next) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET!,
    ) as jwt.JwtPayload;

    // TODO: возможно стоит всю инфу о пользователе записывать в токен,
    // и доставать тут из токена, чтобы не ходить в БД на каждый чих
    if (typeof decoded === "object" && "id" in decoded) {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (user) {
        const { passwordHash: _, ...rest } = user;
        req.user = rest;
      }
    }
  } catch (error) {
    console.error(error);
  }

  next();
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  next();
};
