import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Brand extends Default {

    /**
     * 브랜드 등록
     *
     * @param brandRequest
     */
    public static async save(brandRequest: BrandRequest): Promise<void> {
        let sql: string
        let isUpdate: boolean = !!brandRequest.id

        if (isUpdate) {
            sql = this.getUpdateQuery(brandRequest)
        } else {
            sql = this.getInsertQuery(brandRequest)
        }

        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);

        return res.data[0].insertId;
    }

    /**
     * 브랜드 전체목록 조회
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
     * 브랜드 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findAll(queryParams: QueryParams): Promise<BrandDto[] | null> {
        let sql: string = this.getFindByAllQuery(queryParams);

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }


    /**
     * 브랜드 리스트 조회 - 앱용
     *
     */
    public static async findAllApp(queryParams: QueryParams): Promise<BrandDto[] | null> {
        let sql: string = this.getFindAllAppQuery();

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 브랜드 단건 조회
     *
     * @param id 브랜드 id
     */
    public static async findById(id: number): Promise<BrandDto | null> {
        const sql: string = this.getFindByIdQuery(id);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 브랜드 단건 조회 - 앱용
     *
     * @param queryParams brandId:브랜드 ID
     * @param queryParams userId:사용자 ID
     *
     */
    public static async findByIdApp(queryParams: QueryParams): Promise<BrandDto | null> {
        const sql: string = this.getFindByIdAppQuery(queryParams);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 브랜드 소속 디자이너 조회 - 앱용
     *
     * @param queryParams brandId:브랜드 ID
     *
     */
    public static async findDesignerById(queryParams: QueryParams): Promise<DesignerDto[] | null> {
        const sql = this.getFindDesignerByIdQuery(queryParams);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 브랜드 목록 삭제
     *
     * @param brandRequest[]
     */
    public static async deleteByIds(brandRequest: BrandRequest[]): Promise<void> {

        let queries: string[] = [];
        brandRequest.forEach(brand => {
            queries.push(this.getDeleteQuery(brand.id))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 브랜드 노출여부 변경
     *
     * @param brandRequest[]
     */
    public static async changeShowYnByIds(brandRequest: BrandRequest[]): Promise<void> {

        let queries: string[] = [];
        brandRequest.forEach(brand => {
            queries.push(this.getShowQuery(brand))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }


    /**
     * 브랜드 등록 쿼리 리턴
     *
     * @param brandRequest 브랜드 파라매터
     * @private
     */
    private static getInsertQuery(brandRequest: BrandRequest): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_brands (
            name, description, profile, show_yn, delete_yn, 
                create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?, ?,
                ?, NOW(), ?, NOW());
          `,
            [
                brandRequest.name,
                brandRequest.description,
                brandRequest.profile,
                brandRequest.showYn,
                YN.N,
                brandRequest.createBy,
                brandRequest.createBy
            ]
        );
    }

    /**
     * 브랜드 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    private static getTotalCountQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
      SELECT
          count(1) as totalCount
      FROM tb_brands AS brand
      LEFT JOIN
          (SELECT
              brand_id,
              SUM(1) AS followers
          FROM tb_followers
          WHERE follow_yn = 'Y'
          GROUP BY brand_id) AS followers
      ON brand.id = followers.brand_id
      WHERE brand.delete_yn = 'N'
    `
        );

        if (!!queryParams.keywords) {
            sql += ` AND brand.name like '${'%' + queryParams.keywords + '%'}'`
        }
        //APP용은 showYN='Y'가 필수 - App쪽 컨트롤러에서만 showYn값을 넘김
        if (!!queryParams.App) {
            sql += ` AND brand.show_yn = 'Y'`;
        }
        return sql;
    }

    /**
     * 브랜드 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    private static getFindByAllQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
      SELECT
          id,
          name,
          description,
          profile,
          show_yn,
          create_by,
          create_date,
          update_by,
          update_date,
          IFNULL(followers, 0) AS followers
      FROM tb_brands AS brand
      LEFT JOIN
          (SELECT
              brand_id,
              SUM(1) AS followers
          FROM tb_followers
          WHERE follow_yn = 'Y'
          GROUP BY brand_id) AS followers
      ON brand.id = followers.brand_id
      WHERE brand.delete_yn = 'N'
    `
        );

        if (!!queryParams.keywords) {
            sql += ` AND brand.name like '${'%'+queryParams.keywords+'%'}'`
        }

        sql += ' ORDER BY update_date DESC'

        return sql;
    }

    private static getFindByIdQuery(id: number): string {
        return promiseMysql.format(
            `
      SELECT 
        id,
        name,
        description,
        profile,
        show_yn,
        create_by,
        create_date,
        update_by,
        update_date,
        IFNULL(followers, 0) AS followers
      FROM metafashion.tb_brands AS brand
      LEFT JOIN
          (SELECT
              brand_id,
              SUM(1) AS followers
          FROM tb_followers
          WHERE follow_yn = 'Y'
          GROUP BY brand_id) AS followers
      ON brand.id = followers.brand_id
      WHERE id = ?
        AND delete_yn = 'N';
    `,
            id
        );
    }

    /**
     * 브랜드 리스트 조회 쿼리 리턴- 앱용
     * @private
     */
    private static getFindAllAppQuery() {
        return promiseMysql.format(
            `
        SELECT
            brand.id,
            brand.profile,
            brand.name,
            CONVERT(IFNULL(feed_count, 0),signed ) as feed_count,
            feed_update_date
        FROM tb_brands as brand
        LEFT JOIN
            (SELECT
                  brand_id,
                  DATE_FORMAT(MAX(update_date), '%Y-%m-%d %H:%i') as feed_update_date,
                  SUM(1) as feed_count
            FROM tb_contents
            WHERE show_yn = 'Y'
                AND delete_yn = 'N'
            GROUP BY brand_id) as content ON brand.id = content.brand_id
        WHERE brand.delete_yn = 'N'
            AND brand.show_yn = 'Y'
        ORDER BY feed_update_date desc
        `);
    }

    /**
     * 브랜드 단건 조회 쿼리 리턴 - 앱용
     *
     * @private
     * @param queryParams brandId:브랜드 ID
     * @param queryParams userId:사용자 ID
     *
     */
    private static getFindByIdAppQuery(queryParams: QueryParams) {
        return promiseMysql.format(
            `
              SELECT
                id,
                name,
                description,
                profile,
                IFNULL(followers, 0) as followers,
                IFNULL(feed_count, 0) as feed_count,
                IFNULL(designer_count, 0) as designer_count,
                follow.follow_yn as user_follow_yn
              FROM metafashion.tb_brands as brand
              LEFT JOIN
                  (SELECT
                      brand_id,
                      SUM(1) as followers
                  FROM tb_followers
                  WHERE follow_yn = 'Y'
                  GROUP BY brand_id) as followers
              ON brand.id = followers.brand_id
              LEFT JOIN
                  (SELECT
                      brand_id,
                      SUM(1) as feed_count
                  FROM tb_contents
                  WHERE show_yn = 'Y'
                    AND delete_yn = 'N'
                  GROUP BY brand_id) as content
              ON brand.id = content.brand_id
              LEFT JOIN
                  (SELECT
                      brand_id,
                      SUM(1) as designer_count
                  FROM tb_designer_agencies
                  WHERE delete_yn = 'N'
                  GROUP BY brand_id) as designer
              ON brand.id = designer.brand_id
              LEFT JOIN
                  (SELECT
                     brand_id,
                     follow_yn
                  FROM tb_followers
                  WHERE user_id = ?) as follow
              ON brand.id = follow.brand_id

              WHERE brand.id = ?
                AND delete_yn = 'N';
            `,
            [
                queryParams.userId,
                queryParams.brandId
            ]
        );
    }

    /**
     * 브랜드 소속 디자이너 조회 쿼리 리턴 - 앱용
     *
     * @private
     * @param queryParams brandId:브랜드 ID
     *
     */
    private static getFindDesignerByIdQuery(queryParams: QueryParams) {
        return promiseMysql.format(
            `
        SELECT
            designer.id,
            designer.name,
            designer.profile
        FROM tb_designer_agencies as brand
        JOIN (
            SELECT
                id,
                name,
                profile
            FROM tb_designers
                WHERE delete_yn = 'N'
                    AND show_yn = 'Y') as designer
        ON brand.designer_id = designer.id
        WHERE delete_yn = 'N'
            AND brand_id = ?
        ORDER BY position`,
            queryParams.brandId
        );
    }

    /**
     * 브랜드 업데이트 쿼리 리턴
     *
     * @param brandRequest 브랜드 파라메터
     * @private
     */
    private static getUpdateQuery(brandRequest: BrandRequest): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_brands
          SET
            name = ?, 
            description = ?, 
            profile = ?, 
            show_yn = ?,
            update_by = ?,
            update_date = NOW()
          WHERE id = ?;
          `,
            [
                brandRequest.name,
                brandRequest.description,
                brandRequest.profile,
                brandRequest.showYn,
                brandRequest.updateBy,
                brandRequest.id
            ]
        );
    }

    /**
     * 브랜드 삭제쿼리 리턴
     *
     * @private
     * @param id
     */
    private static getDeleteQuery(id: number): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_brands
            SET delete_yn = ?
            WHERE id = ?;
            `,
            [YN.Y, id]
        );
    }

    /**
     * 브랜드 노출여부 변경 쿼리 리턴
     *
     * @private
     * @param brandRequest
     */
    private static getShowQuery(brandRequest: BrandRequest): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_brands
            SET show_yn = ?
            WHERE id = ?;
            `,
            [brandRequest.showYn, brandRequest.id]
        );
    }
}
