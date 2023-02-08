import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Designer extends Default {

    /**
     * 디자이너 등록
     *
     * @param designerRequest 디자이너 파라메터
     */
    public static async save(designerRequest: DesignerRequest): Promise<void> {
        let sql: string
        let isUpdate: boolean = !!designerRequest.id

        if (isUpdate) {
            sql = this.getUpdateQuery(designerRequest)
        } else {
            sql = this.getInsertQuery(designerRequest)
        }

        const res: SqlResults = await Mysql.transactionQuery(sql);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
        designerRequest.id = res.data[0].insertId

        if (isUpdate) {

        } else {
            const brandSql = this.getBrandInsertQuery(designerRequest)
            const res: SqlResults = await Mysql.transactionQuery(brandSql);
            res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
        }
        console.log("save res", res);
        return res.data[0].insertId;
    }


    /**
     * 디자이너 전체 row 수 조회
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
     * 디자이너 리스트 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findAll(queryParams: QueryParams): Promise<DesignerDto[] | null> {
        let sql: string = this.getFindAllQuery(queryParams);

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 디자이너 단건 조회
     *
     * @param id 디자이너 id
     */
    public static async findById(id: number): Promise<DesignerDto | null> {
        const sql: string = this.getFindByIdQuery(id);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }


    /**
     * 디자이너 리스트 조회 - 앱용
     *
     * @param queryParams type=top : Top 디자이너 검색
     * @param queryParams keywords : 디자이너 검색
     *
     */
    public static async findAllApp(queryParams: QueryParams): Promise<DesignerDto[] | null> {
        let sql: string = this.getFindAllAppQuery(queryParams);
        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 디자이너 단건 조회 - 앱용
     *
     * @param queryParams designerId:디자이너 ID
     * @param queryParams userId:사용자 ID
     *
     */
    public static async findByIdApp(queryParams: QueryParams): Promise<DesignerDto | null> {
        const sql: string = this.getFindByIdAppQuery(queryParams);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }


    /**
     * 디자이너 소속 브랜드 조회
     *
     * @param id 브랜드 ID
     */
    public static async findBrandById(id: number): Promise<BrandDto[] | null> {
        const sql: string = this.getFindBrandByIdQuery(id);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 디자이너 노출여부 변경
     *
     * @param designerRequests[]
     */
    public static async changeShowYnByIds(designerRequests: DesignerRequest[]): Promise<void> {

        let queries: string[] = [];
        designerRequests.forEach(designer => {
            queries.push(this.getShowQuery(designer))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 탑 디자이너 여부 변경
     *
     * @param designerRequests[]
     */
    public static async changeTopYnByIds(designerRequests: DesignerRequest[]): Promise<void> {

        let queries: string[] = [];
        designerRequests.forEach(designer => {
            queries.push(this.getTopQuery(designer))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 탑 디자이너 순서 변경
     *
     * @param designerRequests[]
     */
    public static async changePositionByIds(designerRequests: DesignerRequest[]): Promise<void> {

        let queries: string[] = [];
        designerRequests.forEach(designer => {
            queries.push(this.getPositionQuery(designer))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 디자이너 단건 삭제
     *
     * @param id 디자이너 id
     */
    public static async delete(id: number): Promise<boolean> {
        const sql: string = this.getDeleteQuery(id);

        const res: SqlResults = await Mysql.query(sql);
        return res.code === Mysql.Const.SUCCESS;
    }

    /**
     * 디자이너 다건 삭제
     *
     * @param designerRequest[]
     */
    public static async deleteByIds(designerRequest: DesignerRequest[]): Promise<void> {

        let queries: string[] = [];
        designerRequest.forEach(designer => {
            queries.push(this.getDeleteQuery(designer.id))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }



    /**
     * 디자이너 등록 쿼리 리턴
     *
     * @private
     * @param designerRequest 디자이너 파라메터
     */
    private static getInsertQuery(designerRequest: DesignerRequest): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_designers (
            name, description, profile, show_yn, delete_yn, 
                create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?, ?,
                ?, NOW(), ?, NOW());
          `,
            [
                designerRequest.name,
                designerRequest.description,
                designerRequest.profile,
                designerRequest.showYn,
                YN.N,
                designerRequest.createBy,
                designerRequest.createBy
            ]
        );
    }

    /**
     * 디자이너 소속 브랜드 등록쿼리 리턴
     *
     * @private
     * @param designerRequest 디자이너 파라메터
     */
    private static getBrandInsertQuery(designerRequest: DesignerRequest): string {
        let sql: string = ""
        if (!!designerRequest.brands) {
            const brandList = designerRequest.brands.split(',');
            let queries: string[] = [];
            let position = 1;
            brandList.forEach(id => {
                queries.push(promiseMysql.format(`
                INSERT INTO metafashion.tb_designer_agencies (
                    designer_id, brand_id, position, delete_yn, create_date, update_date
                ) VALUES (?, ?, ?, ?, NOW(), NOW());
                `,
                    [
                        designerRequest.id,
                        id,
                        position++,
                        YN.N
                    ]
                ))
            })

            sql += queries.join('')
        }
        return sql;
    }



    /**
     * 디자이너 Total count 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getTotalCountQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
              SELECT
                count(1) AS totalCount
            FROM tb_designers AS designer
            WHERE delete_yn = 'N'
            `
        );
        //APP용은 showYN='Y'가 필수 - App쪽 컨트롤러에서만 showYn값을 넘김
        if (!!queryParams.App) {
            sql += ` AND designer.show_yn = 'Y'`;
        }

        if (!!queryParams.type) {
            let isTop = (queryParams.type === 'TOP') ? YN.Y : YN.N;
            if (isTop === YN.Y) {
                sql += ` AND designer.top_yn = '${isTop}'`
            }
            else {
                sql += ` AND designer.top_yn = '${isTop}' || designer.top_yn is null`
            }
        }

        if (!!queryParams.keywords) {
            sql += ` AND designer.name like '${'%' + queryParams.keywords + '%'}'`
        }

        return sql;
    }

    /**
     * 디자이너 목록 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getFindAllQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
          SELECT
            id,
            name,
            description,
            profile,
            top_yn,
            show_yn,
            create_by,
            create_date,
            update_by,
            update_date,
            contact_all,
            contact_read,
            followers
        FROM tb_designers AS designer
        LEFT JOIN
            (SELECT
                designer_id,
                SUM(IF(read_yn = 'Y', 1, 0)) AS contact_read,
                SUM(1) AS contact_all
            FROM tb_contact
            GROUP BY designer_id) AS contact
        ON designer.id = contact.designer_id
        LEFT JOIN
            (SELECT
                designer_id,
                SUM(1) AS followers
            FROM tb_followers
            WHERE follow_yn = 'Y'
            GROUP BY designer_id) AS followers
        ON designer.id = followers.designer_id
        WHERE delete_yn = 'N'
        `);

        if (!!queryParams.type) {
            let isTop = (queryParams.type === 'TOP') ? YN.Y : YN.N;
            if (isTop === YN.Y) {
                sql += ` AND designer.top_yn = '${isTop}'`
            }
            else {
                sql += ` AND designer.top_yn = '${isTop}' || designer.top_yn is null`
            }
        }

        if (!!queryParams.keywords) {
            sql += ` AND designer.name like '${'%' + queryParams.keywords + '%'}'`
        }

        sql += ` ORDER BY update_date DESC`

        return sql;
    }

    /**
     * 디자이너 단건 조회쿼리 리턴
     *
     * @private
     * @param id 디자이너 id
     */
    private static getFindByIdQuery(id: number): string {
        return promiseMysql.format(
            `
      SELECT 
        id,
        name,
        description,
        profile,
        IFNULL(top_yn, 'N') AS top_yn,
        top_profile,
        show_yn,
        contact_all,
        contact_read,
        IFNULL(followers, 0) AS followers
      FROM metafashion.tb_designers AS designer
      LEFT JOIN
        (SELECT
            designer_id,
            SUM(IF(read_yn = 'Y', 1, 0)) AS contact_read,
            SUM(1) AS contact_all
        FROM tb_contact
        GROUP BY designer_id) AS contact
        ON designer.id = contact.designer_id
      LEFT JOIN
          (SELECT
              designer_id,
              SUM(1) AS followers
          FROM tb_followers
          WHERE follow_yn = 'Y'
          GROUP BY designer_id) AS followers
      ON designer.id = followers.designer_id
      WHERE id = ?
        AND delete_yn = 'N';`,
            id
        );
    }

    /**
     * 디자이너 목록 조회쿼리 리턴 - 앱용
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getFindAllAppQuery(queryParams: QueryParams) {
        let sql: string = promiseMysql.format(
            `
                SELECT
                    designer.id,
                    designer.name,
                    designer.profile,
                    brand.name as brandTop1,
                    designer.update_date
                FROM tb_designers as designer
                LEFT JOIN
                    (SELECT
                         brand_id,
                         designer_id
                     FROM tb_designer_agencies
                     WHERE position = 1 ) as agency
                ON designer.id = agency.designer_id
                LEFT JOIN
                    (SELECT
                         id,
                         name
                     FROM tb_brands
                     WHERE delete_yn = 'N') as brand
                ON brand.id = agency.brand_id
                WHERE designer.delete_yn = 'N'
                    AND designer.show_yn = 'Y'
                `);

        if (queryParams.type === 'TOP') {
            sql += ` AND designer.top_yn = 'Y'`
        }
        if (!!queryParams.keywords) {
            sql += ` AND designer.name like '${'%' + queryParams.keywords + '%'}'`
        }
        sql += ` ORDER BY update_date DESC`
        return sql;
    }

    /**
     * 디자이너 단건 조회 쿼리 리턴 -앱용
     *
     * @private
     * @param queryParams designerId:디자이너 ID
     * @param queryParams userId:사용자 ID
     *
     */
    private static getFindByIdAppQuery(queryParams: QueryParams) {
        return promiseMysql.format(
            `
            SELECT
                designer.id,
                designer.name,
                designer.description,
                designer.profile,
                designer.top_yn,
                brand.name as brandTop1,
                IFNULL(followers, 0) as followers,
                IFNULL(feedCount, 0) as feedCount,
                follow.follow_yn as user_follow_yn
            FROM metafashion.tb_designers as designer
            LEFT JOIN
                (SELECT
                     brand_id,
                     designer_id
                 FROM tb_designer_agencies
                 WHERE position='1') as agency
            ON designer.id = agency.designer_id
            LEFT JOIN
                (SELECT
                     id,
                     name
                 FROM tb_brands
                 WHERE delete_yn='N') as brand
            ON brand.id = agency.brand_id
            LEFT JOIN
                  (SELECT
                      designer_id,
                      SUM(1) as followers
                  FROM tb_followers
                  WHERE follow_yn = 'Y'
                  GROUP BY designer_id) as followers
                ON designer.id = followers.designer_id
            LEFT JOIN
                  (SELECT
                      designer_id,
                      SUM(1) as feedCount
                  FROM tb_contents
                  WHERE show_yn = 'Y' AND delete_yn = 'N'
                  GROUP BY designer_id) as contents
                ON designer.id = contents.designer_id
            LEFT JOIN
                (SELECT
                     designer_id,
                     follow_yn
                 FROM tb_followers
                 WHERE user_id = ?) as follow
            ON designer.id = follow.designer_id
            WHERE designer.id = ?
                AND designer.delete_yn = 'N'
                AND designer.show_yn = 'Y';`,
            [
                queryParams.userId,
                queryParams.designerId
            ]
        );
    }

    /**
     * 디자이너 소속 브랜드 조회쿼리 리턴
     *
     * @private
     * @param id 디자이너 id
     */
    private static getFindBrandByIdQuery(id: number): string {
        return promiseMysql.format(
            `
        SELECT
            brand.id,
            brand.name,
            brand.profile,
            designer.position
        FROM tb_designer_agencies AS designer
        JOIN (
            SELECT
                id,
                name,
                profile
            FROM tb_brands
                WHERE delete_yn = 'N') AS brand
        ON designer.brand_id = brand.id
        WHERE delete_yn = 'N'
            AND designer_id = ?
        ORDER BY POSITION;`,
            id
        );
    }

    /**
     * 디자이너 업데이트 쿼리 리턴
     *
     * @private
     * @param designerRequest 디자이너 파라메터
     */
    private static getUpdateQuery(designerRequest: DesignerRequest): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_designers
          SET
            name = ?, 
            description = ?, 
            profile = ?, 
            top_yn = ?,
            top_profile = ?,
            show_yn = ?,
            update_by = ?,
            update_date = NOW()
          WHERE id = ?;
          `,
            [
                designerRequest.name,
                designerRequest.description,
                designerRequest.profile,
                designerRequest.topYn,
                designerRequest.topProfile,
                designerRequest.showYn,
                designerRequest.updateBy,
                designerRequest.id
            ]
        );
    }

    /**
     * 디자이너 노출여부 변경 쿼리 리턴
     *
     * @private
     * @param designerRequest
     */
    private static getShowQuery(designerRequest: DesignerRequest): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_designers
            SET show_yn = ?
            WHERE id = ?;
            `,
            [designerRequest.showYn, designerRequest.id]
        );
    }

    /**
     * 탑 디자이너 변경 쿼리 리턴
     *
     * @private
     * @param designerRequest
     */
    private static getTopQuery(designerRequest: DesignerRequest): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_designers
            SET top_yn = ?
            WHERE id = ?;
            `,
            [designerRequest.topYn, designerRequest.id]
        );
    }

    /**
     * 탑 디자이너 순서 변경 쿼리 리턴
     *
     * @private
     * @param designerRequest
     */
    private static getPositionQuery(designerRequest: DesignerRequest): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_designers
            SET top_position = ?
            WHERE id = ?;
            `,
            [designerRequest.topPosition, designerRequest.id]
        );
    }

    /**
     * 디자이너 삭제쿼리 리턴
     *
     * @private
     * @param id
     */
    private static getDeleteQuery(id: number): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_designers
            SET delete_yn = ?
            WHERE id = ?;
            `,
            [YN.Y, id]
        );
    }
}
