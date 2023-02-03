import express from "express";
import {Category} from "@src/services/category";

const route = express.Router();

// 카테고리 전체 목록
route.get("", async (req: express.Request, res: express.Response) => {
    console.log("test ");
    return await Category.findAll()
        .then(categories => {
            const resList: any = [];

            categories?.forEach((category) => {
                resList.push({
                    id: category?.id,
                    name: category.name,
                    position: category.position,
                });
            });

            Category.successWithData(res, resList);
        });
});

export default route;
