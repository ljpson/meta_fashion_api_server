import express from "express";
import { Category } from "@src/services/category";
import { ErrorCode } from "@src/const/error_code";
import { logger } from "@src/utils/logger";

const route = express.Router();

route.post("", async (req: express.Request, res: express.Response) => {
  /*const request: CategoryRequest = req.body.command;

  const entities: any = request.categories;
  let queries: string[] = [];

  for (const idx in entities) {
    const category: any = entities[idx];

    // request.id = category.id;
    request.name = category.name;
    request.position = category.position;

    queries.push(Category.saveQuery(request));
  }

  const transactionQuery: boolean = await Category.saveAll(request);
  console.log("transactionQuery", transactionQuery);

  if (transactionQuery) {
    return res.status(200).json({
      status: ErrorCode.OK,
      message: "success",
    });
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: "category save failed",
    });
  }*/
});

route.get("", async (req: express.Request, res: express.Response) => {
  const accessToken: number = req.body.accessToken;
  const command: string = req.body.command;

  const entities: any = await Category.findAll();
  const resList: any = [];

  for (const idx in entities) {
    const category: any = entities[idx];
    resList.push({
      categoryId: category.category_id,
      title: category.title,
      description: category.description,
      deleted: category.deleted,
      regDt: category.reg_dt,
      updateDt: category.update_dt,
      isShow: category.is_show,
      position: category.position,
    });
  }

  let categoryList: CategoryListResponse = {
    status: ErrorCode.OK,
    message: "success",
    data: resList
  };

  if (entities) {
    return res.status(200).json(categoryList);
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: "category list failed",
    });
  }
});

route.get(
  "/:categoryId",
  async (req: express.Request, res: express.Response) => {
    const categoryId: number = Number(req.params.categoryId);

    // const used: boolean = await Category.isUsed(categoryId);
    // if (used) {
    //   logger.warn(`category used: ${categoryId}`);
    //   return res.status(200).json({
    //     status: ErrorCode.USED_CATEGORY,
    //     message: "Used Category",
    //   });
    // }

    // const categoryDeleted: boolean = await Category.deleteOne(categoryId);
    // if (categoryDeleted) {
    //   return res.status(200).json({
    //     status: ErrorCode.OK,
    //     message: "OK",
    //   });
    // } else {
    //   logger.error(`update category failed: ${categoryId}`);
    //   return res.status(200).json({
    //     status: ErrorCode.QUERY_EXEC_ERROR,
    //     message: "QUERY EXEC ERROR",
    //   });
    // }
  }
);

export default route;
