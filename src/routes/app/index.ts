import express from "express";
import appPolicyRouter from "@src/routes/app/policy";
import appUserRouter from "@src/routes/app/user";
import appDesignerRouter from "@src/routes/app/designer";
import appBrandRouter from "@src/routes/app/brand";
import appCategoryRouter from "@src/routes/app/category";
import appContactRouter from "@src/routes/app/contact";
import appContentRouter from "@src/routes/app/content";
import appLikeRouter from "@src/routes/app/like";
import appSessionRouter from "@src/routes/app/session";
import appPopupRouter from "@src/routes/app/popup";

import { authJWTMiddleware } from "@src/middleware/authJWT";

const route = express.Router();

route.use("/policies", appPolicyRouter);
route.use("/users", appUserRouter);
route.use("/categories", appCategoryRouter);
route.use("/designers", appDesignerRouter);
route.use("/brands", appBrandRouter);
route.use("/contact", appContactRouter);
route.use("/contents", appContentRouter);
route.use("/likes", appLikeRouter);
route.use("/session", appSessionRouter);
route.use("/popups", appPopupRouter);

export default route;





