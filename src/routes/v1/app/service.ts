import express from 'express';
import { Category } from '@src/services/category'
import { ErrorCode } from '@src/const/error_code'
import {logger} from "@src/utils/logger";

const route = express.Router();

route.post('/main', async (req: express.Request, res: express.Response) => {
  const accountId: number = req.body.accountId;


  const preset = require("../../../../data/main.json");
  const jsonData = JSON.parse(JSON.stringify(preset));

  if (jsonData) {
    return res.status(200).json({
      status: ErrorCode.OK,
      message: 'success',
      command: jsonData,
      serverTimestamp: 1635413389335
    });
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: 'json load failed',
      serverTimestamp: 1635413389335
    })
  }
});


route.post('/main/detail', async (req: express.Request, res: express.Response) => {
  const contentId: number = req.body.command.contentId;
  if (!contentId) {
    return res.status(200).json({
      status: ErrorCode.INVALID_CONTENT_ID,
      message: 'INVALID_CONTENT_ID'
    });
  }

  const preset = require("../../../../data/detail/detail_"+contentId+".json");
  const jsonData = JSON.parse(JSON.stringify(preset));

  if (jsonData) {
    return res.status(200).json({
      status: ErrorCode.OK,
      message: 'success',
      command: jsonData,
      serverTimestamp: 1635413389335
    });
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: 'json load failed',
      command: {},
      serverTimestamp: 1635413389335
    })
  }
});


export default route;