import express from "express";
import { Notice } from "@src/services/notice";
import { User } from "@src/services/user";
import { ErrorCode } from "@src/const/error_code";
import isTaxID from "validator/lib/isTaxID";

const route = express.Router();

route.patch("/", async (req: express.Request, res: express.Response) => {
  const accountId: number = req.body.accountId;
  const allow: boolean = req.body.allow;
  const currentTime: number = Date.now();
  const patched: boolean = await User.patchPolicyAllow(
    accountId,
    allow,
    currentTime
  );
  if (patched) {
    return res.status(200).json({
      errorCode: ErrorCode.OK,
      message: "Policy allow updated",
      pushAllowDate: currentTime,
    });
  } else {
    return res.status(500).json({
      errorCode: ErrorCode.QUERY_EXEC_ERROR,
      message: "Policy allow update failed",
    });
  }
});

route.get("", async (req: express.Request, res: express.Response) => {
  const request: NoticeRequest = req.body.command;

  const entities: any = await Notice.selectAll(request.type);

  const resList: any = [];
  const versionList: any = [];

  for (const idx in entities) {
    const notice: any = entities[idx];
    versionList.push({
      noticeId: notice.notice_id,
      updateDt: notice.update_dt,
    });
    if (notice.deleted === 0) {
      resList.push({
        noticeId: notice.notice_id,
        title: notice.title,
        description: notice.description,
        updateDt: notice.update_dt,
      });
    }
  }

  let noticeList = {
    status: ErrorCode.OK,
    message: "success",
    command: {
      version: versionList,
      noticeId: resList[0].noticeId,
      description: resList[0].description,
      updateDt: resList[0].updateDt,
    },
  };

  if (entities) {
    return res.status(200).json(noticeList);
  } else {
    return res.status(200).json({
      status: ErrorCode.NOTICE_LOAD_FAIL,
      message: "NOTICE_LOAD_FAIL",
    });
  }
});

route.post("/create", async (req: express.Request, res: express.Response) => {
  const request: NoticeRequest = req.body.command;

  const noticeSave: boolean = await Notice.save(request);
  // const noticeUpdate: boolean = await Notice.update(request);

  if (noticeSave) {
    return res.status(200).json({
      status: ErrorCode.OK,
      message: "success",
    });
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: "category save failed",
    });
  }
});

export default route;
