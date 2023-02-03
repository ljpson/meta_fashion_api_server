import express from "express";
import {Policy} from "@src/services/policy";

const route = express.Router();

route.get("", async (req: express.Request, res: express.Response) => {
  const accessToken: number = req.body.accessToken;
  const command: string = req.body.command;

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

            Policy.successWithData(res, resList);
          });
});

route.get("/:id", async (req: express.Request, res: express.Response) => {
  const accessToken: number = req.body.accessToken;
  const command: string = req.body.command;

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
