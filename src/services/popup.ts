import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Popup extends Default {

    /**
     * 팝업 등록
     *
     * @param popupRequest 팝업 파라메터
     */
    public static async save(popupRequest: PopupRequest): Promise<void> {
        let sql: string
        let isUpdate: boolean = !!popupRequest.id

        if (!!isUpdate) {
            sql = this.getUpdateQuery(popupRequest)
        } else {
            sql = this.getInsertQuery(popupRequest)
        }

        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
        return res.data[0].insertId;
    }

    /**
     * 팝업 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async totalCount(queryParams: QueryParams): Promise<QueryParams> {
        let sql: string = this.getTotalCountQuery(queryParams);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            queryParams.totalCount = res.data[0].totalCount;
        }
        return queryParams;
    }

    /**
     * 팝업 전체목록 조회
     */
    public static async findAll(queryParams: QueryParams): Promise<PopupDto[] | null> {
        let sql: string = this.getFindAllQuery(queryParams);

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 팝업 단건 조회
     * @param id
     */
    public static async findById(id: number): Promise<PopupDto | null> {
        const sql: string = this.getFinById(id);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 팝업 등록 쿼리 리턴
     *
     * @private
     * @param popupRequest 팝업 파라메터
     */
    private static getInsertQuery(popupRequest: PopupRequest): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_popups (
            title, image, show_from, show_to, show_yn, 
                create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?, ?,
                ?, NOW(), ?, NOW());
          `,
            [
                popupRequest.title,
                popupRequest.image,
                popupRequest.showFrom,
                popupRequest.showTo,
                popupRequest.showYn,
                popupRequest.createBy,
                popupRequest.createBy
            ]
        );
    }

    /**
     * 팝업 Total count 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getTotalCountQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
      SELECT
          COUNT(1)
      FROM metafashion.tb_popups AS popup
    `
        );

        if (!!queryParams.keywords) {
            sql += ` AND popup.name like '${'%' + queryParams.keywords + '%'}'`
        }

        return sql;
    }

    /**
     * 팝업 전체목록 조회쿼리 리턴
     *
     * @param queryParams 쿼리 파라메터
     * @private
     */
    private static getFindAllQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
      SELECT
          id,
          title,
          image,
          show_from,
          show_to,
          show_yn,
          create_by,
          create_date,
          update_by,
          update_date,
          if(show_to <= NOW(), 'FINISH', 'PUBLISH') AS status
      FROM metafashion.tb_popups AS popup
      WHERE 1=1
    `
        );
        //APP용은 showYN='Y'가 필수
        if (!!queryParams.App) {
            sql += ` AND popup.show_yn = 'Y'
                        AND popup.show_from < NOW()
                        AND popup.show_to > NOW()`;
        }
        if (!!queryParams.keywords) {
            sql += ` AND popup.name like '${'%' + queryParams.keywords + '%'}'`
        }
        sql += ` ORDER BY update_date DESC`

        return sql;
    }

    /**
     * 팝업 단건 조회쿼리 리턴
     *
     * @private
     * @param id 팝업 id
     */
    private static getFinById(id: number): string {
        return promiseMysql.format(
            `
      SELECT 
        id,
        title,
        image,
        show_from,
        show_to,
        show_yn
      FROM metafashion.tb_popups
      WHERE id = ?
    `,
            id
        );
    }

    /**
     * 팝업 업데이트 쿼리 리턴
     *
     * @private
     * @param popupRequest 팝업 파라메터
     */
    private static getUpdateQuery(popupRequest: PopupRequest): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_popups
          SET
            title = ?, 
            image = ?, 
            show_from = ?, 
            show_to = ?,
            show_yn = ?,
            update_by = ?,
            update_date = NOW()
          WHERE id = ?;
          `,
            [
                popupRequest.title,
                popupRequest.image,
                popupRequest.showFrom,
                popupRequest.showTo,
                popupRequest.showYn,
                popupRequest.updateBy,
                popupRequest.id
            ]
        );
    }
}
