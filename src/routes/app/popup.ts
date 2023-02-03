import express from "express";
import {Policy} from "@src/services/policy";
import {Brand} from "@src/services/brand";
import {Popup} from "@src/services/popup";

const route = express.Router();

route.get("", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const queryParams: QueryParams = req.query;

    queryParams.App = "Y";

    return await Popup.totalCount(queryParams)
        .then(queryParams => Popup.findAll(queryParams)
            .then(popups => {
                const resList: any = [];

                popups?.forEach((popup) => {
                    //image가 존재할 경우 urlPrefix 추가
                    if (!!popup?.image) popup.image = urlPrefix + popup.image;

                    resList.push({
                        id: popup?.id,
                        title: popup.title,
                        image: popup.image,
                        showFrom: popup.showFrom,
                        showTo: popup.showTo,
                        showYn: popup.showYn,
                        createBy: popup.createBy,
                        createDate: popup.createDate,
                        updateBy: popup.updateBy,
                        updateDate: popup.updateDate,
                        status: popup.status
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

// 팝업 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const id: number = Number(req.params.id);

    return await Popup.findById(id)
        .then(popup => {
            //image가 존재할 경우 urlPrefix 추가
            if (!!popup?.image) popup.image = urlPrefix + popup.image;

            let result = {
                id: popup?.id,
                title: popup?.title,
                image: popup?.image,
                showFrom: popup?.showFrom,
                showTo: popup?.showTo,
                showYn: popup?.showYn,
            };

            Policy.successWithData(res, result)
        });
});

export default route;
