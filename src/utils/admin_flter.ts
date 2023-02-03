import express from "express";
import fs from "fs";
import {Token} from "@src/utils/token";
import {ErrorCode} from "@src/const/error_code";
import admin from "@src/routes/cms/admin";

export const adminFilter = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    let accessToken: any = req.header("Authorization");

    if (!accessToken) {
        return res.status(200).json({
            status: ErrorCode.INVALID_ID_TOKEN,
            message: "INVALID ID TOKEN",
        });
    }

    accessToken = !!accessToken && accessToken.replace("Bearer ", "")

    let adminInfo: any;
    // 관리자 일 경우 로그인 정보 req 로 전달
    if (req.baseUrl.startsWith('/cms')) {
        adminInfo = await Token.verifyAdmin(accessToken);
    }

    if (!adminInfo) {
        return res.status(200).json({
            status: ErrorCode.TOKEN_EXPIRED_ERROR,
            message: "TOKEN_EXPIRED_ERROR",
        });
    }

    req.body.admin = adminInfo;
    next();
};