import express from "express";
import sessionRouter from "@src/routes/v1/session";
import userRouter from "@src/routes/v1/user";
import categoryRouter from "@src/routes/v1/category";
import contentRouter from "@src/routes/v1/content";
import policyRouter from "@src/routes/v1/policy";
import serviceRouter from "@src/routes/v1/app/service";

import { authJWTMiddleware } from "@src/middleware/authJWT";

const route = express.Router();

route.use("/session", sessionRouter);
route.use("/user", userRouter);
// route.use("/category", authJWTMiddleware, categoryRouter);
route.use("/categories", categoryRouter);
// route.use("/content", authJWTMiddleware, contentRouter);
route.use("/content", contentRouter);
route.use("/policy", policyRouter);
route.use("/service", serviceRouter);

export default route;
