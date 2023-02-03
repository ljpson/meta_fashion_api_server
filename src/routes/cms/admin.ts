import express from "express";
import {Policy} from "@src/services/policy";
import {Brand} from "@src/services/brand";
import {Admin} from "@src/services/admin";
import {adminFilter} from "@src/utils/admin_flter";

const route = express.Router();

route.post("", adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const adminRequest: AdminRequest = req.body.data;

    // 작성자 설정
    adminRequest.createBy = admin.account;
    return await Admin.save(adminRequest)
        .then(_ => Admin.success(res))
        .catch(e => Admin.fail(res, e));
});

// 관리자 수정
route.post("/:id/save", adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const adminRequest: AdminRequest = req.body.data;

    adminRequest.id = Number(req.params.id);
    adminRequest.updateBy = admin.account;
    return await Admin.save(adminRequest)
        .then(_ => Admin.success(res))
        .catch(e => Admin.fail(res, e));
});

// 관리자 조회
route.get("", async (req: express.Request, res: express.Response) => {
    const queryParams: QueryParams = req.query

    return await Admin.totalCount(queryParams)
        .then(queryParams => Admin.findAll(queryParams)
            .then(admins => {
                const resList: any = [];

                admins?.forEach((admin) => {
                    resList.push({
                        id: admin?.id,
                        account: admin?.account,
                        name: admin?.name,
                        part: admin?.part,
                        authority: admin?.authority,
                        status: admin?.status,
                        updateBy: admin.updateBy,
                        updateDate: admin.updateDate
                    });
                });

                if (!!queryParams.totalCount) {
                    res.header("X-Total-count", String(queryParams.totalCount));
                }
                if (!!queryParams.size) {
                    res.header("X-Limit", String(queryParams.size));
                }
                Brand.successWithData(res, resList);
            }));
});

// 관리자 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {

    const id: number = Number(req.params.id);
    return await Admin.findById(id)
        .then(admin => {

            let result = {
                id: admin?.id,
                account: admin?.account,
                name: admin?.name,
                part: admin?.part,
                authority: admin?.authority,
                status: admin?.status,
            };

            Policy.successWithData(res, result)
        });
});

export default route;
