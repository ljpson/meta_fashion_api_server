import {ErrorCode} from "@src/const/error_code";
import express from "express";
import {CustomError} from "@src/errors/CustomError";

export class Default {

    public static success(res: express.Response): express.Response {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: "success",
        });
    }

    public static successWithData(res: express.Response, data: any): express.Response {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: "success",
            data: data
        });
    }

    public static fail(res: express.Response, error: CustomError): express.Response {
        let errorCode = error.getCode() ?? ErrorCode.QUERY_EXEC_ERROR
        let errorMessage = error.message ?? `${res.req.method} ${res.req.baseUrl} call failed`

        return res.status(200).json({
            status: errorCode,
            message: errorMessage,
        });
    }

    public static appendPagination(sql: string, queryParams: QueryParams): string {
        if (!!queryParams.page && !!queryParams.size) {
            let start = 0;
            let page: number = Number(queryParams.page)
            let size: number = Number(queryParams.size)

            if (page <= 0) {
                page = 1;
            } else {
                start = (page - 1) * size;
            }

            const totalCount = queryParams.totalCount!
            if (page > Math.round(totalCount / size)) {
                return sql;
            }

            sql += ` LIMIT ${start}, ${size}`
        }

        return sql
    }

}