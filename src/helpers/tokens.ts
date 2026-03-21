import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { cookieOptions } from "../config";

type ExpirationTime =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`
  | `${number}w`
  | number;

export const signToken = (
  payload: jwt.JwtPayload,
  secret: string,
  expiresIn: ExpirationTime,
) =>
  jwt.sign(
    {
      id: payload.id,
    },
    secret,
    { expiresIn },
  );

export const verifyAndRefreshTokens = async (
  req: Request,
  res: Response,
): Promise<boolean> => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  try {
    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as jwt.JwtPayload;

    return true;
  } catch (error) {
    try {
      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!,
      ) as jwt.JwtPayload;

      const newAccessToken = signToken(
        { id: decodedRefresh.id, role: decodedRefresh.role },
        process.env.JWT_ACCESS_SECRET!,
        "15m",
      );

      res.cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 15,
      });

      req.cookies.accessToken = newAccessToken;
      return true;
    } catch (error) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      console.error(error);

      return false;
    }
  }
};
