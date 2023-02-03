import express from "express";
// import userRouter from "@src/routes/v1/user";
import categoryRouter from "@src/routes/cms/category";
import contentRouter from "@src/routes/cms/content";
import designerRouter from "@src/routes/cms/designer";
import policyRouter from "@src/routes/cms/policy";
import brandRouter from "@src/routes/cms/brand";
import popupRouter from "@src/routes/cms/popup";
import adminRouter from "@src/routes/cms/admin";
import userRouter from "@src/routes/cms/user";
import sessionRouter from "@src/routes/cms/session";
import {authJWTMiddleware} from "@src/middleware/authJWT";

const route = express.Router();

route.use("/categories", authJWTMiddleware, categoryRouter);
route.use("/contents", authJWTMiddleware, contentRouter);
route.use("/designers", authJWTMiddleware, designerRouter);
route.use("/policies", authJWTMiddleware, policyRouter);
route.use("/brands", authJWTMiddleware, brandRouter);
route.use("/popups", authJWTMiddleware, popupRouter);
route.use("/admins", authJWTMiddleware, adminRouter);
route.use("/users", authJWTMiddleware, userRouter);
route.use("/session", sessionRouter);

export default route;
