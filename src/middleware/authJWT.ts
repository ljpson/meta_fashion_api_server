import express from "express";
import { ErrorCode } from "@src/const/error_code";
import { Token } from "@src/utils";

export const authJWTMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  let accessToken: any = req.body.accessToken
    ? req.body.accessToken
    : req.headers.accesstoken;

  if (!accessToken) {
    accessToken = req.header("Authorization")
    accessToken = !!accessToken && accessToken.replace("Bearer ", "")
  }

  if (!accessToken) {
    return res.status(200).json({
      status: ErrorCode.INVALID_ID_TOKEN,
      message: "INVALID ID TOKEN",
    });
  }

  const exists: number = await Token.verify(accessToken);
  if (exists == 0) {
    return res.status(200).json({
      status: ErrorCode.TOKEN_EXPIRED_ERROR,
      message: "TOKEN_EXPIRED_ERROR",
    });
  }
  next();
};
