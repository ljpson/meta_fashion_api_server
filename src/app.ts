import "dotenv/config";
import "module-alias/register";
import mysql from "mysql2/promise";
import { Config } from "@src/config/config";
import { logger } from "@src/utils/logger";
import express from "express";
// import appRouter from "@src/routes/v1/app";
// import v1Router from "@src/routes/index";
import cmsRouter from "@src/routes/cms/index";
import appRouter from "@src/routes/app/index";
import morgan from "morgan";
import { maintenanceMiddleware } from "@src/middleware/maintenance";
import { ErrorCode } from "@src/const/error_code";
class BadRequestError extends Error {}

const path = require("path");
const cors = require("cors");
const helmet = require('helmet');
const csp = require('helmet-csp');

export const mysqlPool = mysql.createPool(Config.Env.MySql.PROJECT);

const PORT = (process.env.PORT as string) || "8081";
const app = express();
/* 230127 한국민 : 보안 소스 때문에 러너스하이 IP로 구글 토큰 받아오는 것 안되서 주석처리
app.use(helmet());

// 테스트 임시 추후 삭제
app.use(
    csp({
      directives: {
        defaultSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
      },
    })
);
*/
app.use(morgan("short"));
app.use(express.json());

app.use("/google_test", function (req, res) {
  res.sendFile(path.join(__dirname, "../src/google_sign_in.html"));
});
app.use(cors());

app.use(maintenanceMiddleware);

// app.use("/", appRouter);
// app.use("/app/v1", v1Router);

app.use("/cms", cmsRouter);
app.use("/app", appRouter);

//file save path
app.use("/resources", express.static(path.join(__dirname, "../resources")));
app.use("/api/resources", express.static("./resources"));

// health check for loadbalancer
app.get("/healthcheck", (req: express.Request, res: express.Response) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  logger.info(`Listen on port ${PORT}`);
});

// 오류 핸들러 추가
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof BadRequestError) {
        res.status(400);
        res.json({message: err.message});
    } else {
        res.status(500);
        res.json({
            code: 500,
            message: err.message
        });
    }
});