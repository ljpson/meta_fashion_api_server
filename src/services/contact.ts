import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Contact extends Default {

    /**
     * 메시지 등록
     * @param contactRequest 메시지 파라메터
     */
    public static async save(contactRequest: ContactRequest): Promise<void> {

        let sql: string = this.getInsertQuery(contactRequest);

        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);

    }


    /**
     * 메시지 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async totalCount(queryParams: QueryParams): Promise<QueryParams> {
        let sql: string = this.getTotalCountQuery(queryParams)

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            queryParams.totalCount = res.data[0].totalCount;
        }
        return queryParams;
    }

    /**
     * 메시지 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findAll(queryParams: QueryParams): Promise<ContactDto[] | null> {
        let sql: string = this.getFindAllQuery(queryParams)

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 메시지 읽음처리
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async read(queryParams: QueryParams): Promise<void> {
        let sql: string = this.getUpdateQuery(queryParams)

        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }


    /**
     * 메시지 등록 쿼리 리턴
     *
     * @private
     * @param contactRequest 콘텐츠 파라메터
     */
    private static getInsertQuery(contactRequest: ContactRequest): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_contact (
                designer_id, 
                user_id, 
                name, 
                email, 
                phone, 
                message, 
                read_yn, 
                create_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `,
            [
                contactRequest.designerId,
                contactRequest.userId,
                contactRequest.name,
                contactRequest.email,
                contactRequest.phone,
                contactRequest.message,
                'N'
            ]
        );
    }

    /**
     * 메시지 전체 Row 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getTotalCountQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
                COUNT(1) AS totalCount
            FROM metafashion.tb_contact
            WHERE designer_id = ?
          `,
            [
                queryParams.id
            ]
        );
    }

    /**
     * 메시지 전체 Row 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getFindAllQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
                contact.id,
                name,
                user.email AS account,
                contact.email,
                phone,
                message,
                read_yn,
                create_date,
                contact_read,
                contact_all
            FROM metafashion.tb_contact AS contact
            LEFT JOIN (
                SELECT
                    id,
                    email
                FROM metafashion.tb_users
            ) AS user
            ON contact.user_id = user.id
            JOIN (SELECT
                        designer_id,
                        SUM(IF(read_yn = 'Y', 1, 0)) AS contact_read,
                        SUM(1) AS contact_all
                    FROM metafashion.tb_contact
                    GROUP BY designer_id) AS contact_read
            ON contact.designer_id = contact_read.designer_id
            WHERE contact.designer_id = ?
            ORDER BY create_date DESC
          `,
            [
                queryParams.id,
            ]
        );
    }

    /**
     * 메시지 읽음처리 쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getUpdateQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_contact
          SET
            read_yn = ?
          WHERE id = ?;
          `,
            [
                YN.Y,
                queryParams.id,
            ]
        );
    }
}
