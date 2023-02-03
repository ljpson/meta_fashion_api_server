import express from 'express';
import { Notice } from '@src/services/notice'
import { ErrorCode } from '@src/const/error_code'
import {logger} from "@src/utils/logger";

const route = express.Router();

route.get('/version', async (req: express.Request, res: express.Response) => {
    const accountId: number = req.body.accountId;

    const preset = require("../../../data/version.json");
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

route.post('/terms', async (req: express.Request, res: express.Response) => {
    const termData: any = await Notice.findOne('terms');

    if (!termData) {
        return res.status(200).json({
            status: ErrorCode.NOTICE_LOAD_FAIL,
            message: 'NOTICE_LOAD_FAIL'
        });
    }
    const command = {
        "htmlData": termData.description
    }

    if (termData) {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: 'success',
            command: command,
            serverTimestamp: 1635413389335
        });
    } else {
        return res.status(200).json({
            status: ErrorCode.NOTICE_LOAD_FAIL,
            message: 'NOTICE_LOAD_FAIL',
            serverTimestamp: 1635413389335
        })
    }
});


route.post('/policy', async (req: express.Request, res: express.Response) => {
    const policyData: any = await Notice.findOne('policy');

    if (!policyData) {
        return res.status(200).json({
            status: ErrorCode.NOTICE_LOAD_FAIL,
            message: 'NOTICE_LOAD_FAIL'
        });
    }

    const command = {
        "htmlData": policyData.description
    }

    if (policyData) {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: 'success',
            command: command,
            serverTimestamp: 1635413389335
        });
    } else {
        return res.status(200).json({
            status: ErrorCode.NOTICE_LOAD_FAIL,
            message: 'NOTICE_LOAD_FAIL',
            command: {},
            serverTimestamp: 1635413389335
        })
    }
});


export default route;