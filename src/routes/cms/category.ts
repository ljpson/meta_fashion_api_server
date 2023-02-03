import express from "express";
import {Category} from "@src/services/category";

const route = express.Router();

// 카테고리 등록
route.post("", async (req: express.Request, res: express.Response) => {
    const categories: CategoryRequest[] = req.body.data;
    return await Category.saveAll(categories)
        .then(_ => Category.success(res))
        .catch(e => Category.fail(res, e));
});

// 카테고리 전체 목록
route.get("", async (req: express.Request, res: express.Response) => {

    return await Category.findAll()
        .then(categories => {
            const resList: any = [];

            categories?.forEach((category) => {
                resList.push({
                    id: category?.id,
                    name: category.name,
                    position: category.position,
                    deleteYn: category.deleteYn,
                    createDate: category.createDate,
                    updateDate: category.updateDate,
                });
            });

            Category.successWithData(res, categories);
        })
        .catch(e => {
            Category.fail(res, e)
        });
});

// 카테고리 삭제
route.delete("/:id", async (req: express.Request, res: express.Response) => {
        const id: number = Number(req.params.id);

        return await Category.deleteOne(id)
            .then(_ => Category.success(res))
            .catch(e => {
                Category.fail(res, e)
            });
    }
);

export default route;
