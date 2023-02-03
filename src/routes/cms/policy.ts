import express from "express";
import {Policy} from "@src/services/policy";
import {Brand} from "@src/services/brand";
import {adminFilter} from "@src/utils/admin_flter";

const route = express.Router();

route.post("", adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const policyRequest: PolicyRequest = req.body.data;

    // 작성자 설정
    policyRequest.createBy = admin.account;
    return await Policy.save(policyRequest)
        .then(_ => Policy.success(res))
        .catch(e => Policy.fail(res, e));
});

route.get("", async (req: express.Request, res: express.Response) => {
    const type: string = req.query['type'] as string;

    return await Policy.findByType(type)
        .then(policies => {
            const resList: any = [];

            policies?.forEach((policy) => {
                resList.push({
                    id: policy.id,
                    type: policy.type,
                    contents: policy.contents,
                    showFrom: policy.showFrom,
                    showTo: policy.showTo,
                });
            });

            Brand.successWithData(res, resList);
        });
});

route.get("/:id", async (req: express.Request, res: express.Response) => {
    const id: number = Number(req.params.id);
    return await Policy.findById(id)
        .then(policy => {

            let result = {
                id: policy?.id,
                type: policy?.type,
                contents: policy?.contents,
                showFrom: policy?.showFrom,
                showTo: policy?.showTo,
            };

            Policy.successWithData(res, result)
        });
});

export default route;
