import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Follower extends Default {

    /**
     * 브랜드 팔로잉/언팔로잉
     *
     * @param followRequest 팔로잉 파라메터
     *
     */
    public static async changeFollowYn(followRequest: FollowRequest): Promise<void> {
        let sql: string = ""

        if (!!followRequest.brandId) {
            sql = this.changeBrandFollowYnQuery(followRequest);
        } else if (!!followRequest.designerId) {
            sql = this.changeDesignerFollowYnQuery(followRequest);
        }
        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }


    /**
     * 팔로잉 상세정보 조회
     *
     * @param followRequest 팔로잉 파라메터
     *
     */
    public static async getFollower(followRequest: FollowRequest): Promise<FollowRequest> {
        //처음 팔로워 할 때 기본세팅
        followRequest.followId = 0;
        followRequest.followYn = 'Y';
        let sql: string = this.getFollowerQuery(followRequest);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            //이미 팔로워한 정보가 있을 경우 - 기존정보 받아오기
            if(res.data.length > 0){
                followRequest.followId = res.data[0].id;
                followRequest.followYn = res.data[0].followYn;
            }
        }
        return followRequest;
    }

    /**
     * 팔로잉 테이블 Insert가능한 ID 조회
     */
    public static async getMaxFollowerId(): Promise<number> {
        const followId: number = 0;
        let sql: string = this.getMaxFollowerIdQuery();
        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0].id;
        }
        return followId;
    }

    /**
     * 팔로워 Total count 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async totalCount(queryParams: QueryParams): Promise<QueryParams> {
        let sql: string = ""
        let sql1: string = ""
        let sql2: string = ""

        if (queryParams.type === 'BRAND') {
            sql = this.getBrandFollowerTotalCountQuery(queryParams)
        }
        else if (queryParams.type === 'DESIGNER') {
            sql = this.getDesignerFollowerTotalCountQuery(queryParams)
        }
        else if (queryParams.type === 'USER') {
            if (queryParams.keywords === 'DESIGNER') {
                sql = this.getUserFollowDesignerTotalCountQuery(queryParams)
            }
            else if(queryParams.keywords === 'BRAND') {
                sql = this.getUserFollowBrandTotalCountQuery(queryParams)
            }
            else if(queryParams.keywords === 'ALL') {
                sql1 = this.getUserFollowDesignerTotalCountQuery(queryParams);
                sql2 = this.getUserFollowBrandTotalCountQuery(queryParams);
            }
        }

        if(queryParams.keywords === 'ALL') {
            const res1: SqlResults = await Mysql.query(sql1);
            if (res1.code === Mysql.Const.SUCCESS) {
                queryParams.totalCount = res1.data[0].totalCount;
            }
            const res2: SqlResults = await Mysql.query(sql2);
            if (res2.code === Mysql.Const.SUCCESS) {
                queryParams.totalCount += res2.data[0].totalCount;
            }
        } else {
            const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
            if (res.code === Mysql.Const.SUCCESS) {
                queryParams.totalCount = res.data[0].totalCount;
            }
        }
        return queryParams;
    }

    /**
     * 팔로워 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findAll(queryParams: QueryParams): Promise<FollowerDto[] | null> {
        let sql: string = ""

        if (queryParams.type === 'BRAND') {
            sql = this.getBrandFollowerQuery(queryParams)
        }
        else if (queryParams.type === 'DESIGNER') {
            sql = this.getDesignerFollowerQuery(queryParams)
        }
        else if (queryParams.type === 'USER') {
            if (queryParams.keywords === 'DESIGNER') {
                sql = this.getUserFollowDesignerQuery(queryParams)
            }
            else if(queryParams.keywords === 'BRAND') {
                sql = this.getUserFollowBrandQuery(queryParams)
            }
            else if(queryParams.keywords === 'ALL') {
                console.log(queryParams);
                sql = this.getFindAllAppQuery(queryParams)
            }
        }

        sql += ` ORDER BY update_date DESC`
        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 브랜드 팔로잉/언팔로잉
     *
     * @private
     * @param followRequest 팔로잉 파라메터
     *
     */
    private static changeBrandFollowYnQuery(followRequest: FollowRequest) {
        return promiseMysql.format(
            `
                INSERT INTO tb_followers (id, brand_id, user_id, follow_yn, create_date)
                VALUES (?, ?, ?, ?, now())
                    ON DUPLICATE KEY
                        UPDATE follow_yn = (SELECT if(ifnull(follow_yn,'N')='N','Y','N')
                                              FROM tb_followers as a
                                              WHERE id = ?)
                             , update_date = now();
              `,
            [
                followRequest.followId,
                followRequest.brandId,
                followRequest.userId,
                followRequest.followYn,
                followRequest.followId
            ]
        );
    }

    /**
     * 디자이너 팔로잉/언팔로잉
     *
     * @private
     * @param followRequest 팔로잉 파라메터
     *
     */
    private static changeDesignerFollowYnQuery(followRequest: FollowRequest) {
        return promiseMysql.format(
            `
                INSERT INTO tb_followers (id, designer_id, user_id, follow_yn, create_date)
                VALUES (?, ?, ?, ?, now())
                    ON DUPLICATE KEY
                        UPDATE follow_yn = (SELECT if(ifnull(follow_yn,'N')='N','Y','N')
                                              FROM tb_followers as a
                                              WHERE id = ?)
                             , update_date = now();
              `,
            [
                followRequest.followId,
                followRequest.designerId,
                followRequest.userId,
                followRequest.followYn,
                followRequest.followId
            ]
        );
    }

    /**
     * 팔로잉 상세정보 조회
     *
     * @private
     * @param followRequest 팔로잉 파라메터
     *
     */
    private static getFollowerQuery(followRequest: FollowRequest) {
        let sql: string = promiseMysql.format(
            `
                SELECT *
                FROM tb_followers
                WHERE user_id = ?
                `,
            [
                followRequest.userId
            ]
        );
        //브랜드 검색
        if (!!followRequest.brandId) {
            sql += ` AND brand_id = '`+ followRequest.brandId + `'`;
        }
        //디자이너 검색
        if (!!followRequest.designerId) {
            sql += ` AND designer_id = '`+ followRequest.designerId + `'`;
        }
        return sql;
    }

    /**
     * 팔로잉 테이블 Insert가능한 ID 조회
     *
     * @private
     */
    private static getMaxFollowerIdQuery() {
        return promiseMysql.format(
            `
                SELECT Max(id)+1 as id
                FROM tb_followers
                `
        );
    }

    /**
     * 브랜드 팔로워 Total count 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getBrandFollowerTotalCountQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
                count(1) AS totalCount
            FROM metafashion.tb_followers AS followers
            LEFT JOIN
                 (select
                      id
                  FROM metafashion.tb_users
                  WHERE leave_yn = 'N'
                  )AS users
            ON followers.user_id = users.id
            WHERE follow_yn = 'Y'
                AND brand_id = ?
          `,
            [
                queryParams.id
            ]
        );
    }

    /**
     * 브랜드 팔로워 전체 Row 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getBrandFollowerQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
                users.id,
                users.nickname,
                users.profile,
                users.email,
                users.gender
            FROM metafashion.tb_followers AS followers
            LEFT JOIN
                 (select
                      id,
                      nickname,
                      profile,
                      email,
                      gender
                  FROM metafashion.tb_users
                  WHERE leave_yn = 'N'
                  )AS users
            ON followers.user_id = users.id
            WHERE follow_yn = 'Y'
                AND brand_id = ?
          `,
            [
                queryParams.id,
            ]
        );
    }

    /**
     * 디자이너 팔로워 Total count 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getDesignerFollowerTotalCountQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
                count(1) AS totalCount
            FROM metafashion.tb_followers AS followers
            LEFT JOIN
                 (select
                      id
                  FROM metafashion.tb_users
                  WHERE leave_yn = 'N'
                  )AS users
            ON followers.user_id = users.id
            WHERE follow_yn = 'Y'
                AND designer_id = ?
          `,
            [
                queryParams.id
            ]
        );
    }

    /**
     * 디자이너 팔로워 전체 Row 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getDesignerFollowerQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
                users.id,
                users.nickname,
                users.profile,
                users.email,
                users.gender
            FROM metafashion.tb_followers AS followers
            LEFT JOIN
                 (select
                      id,
                      nickname,
                      profile,
                      email,
                      gender
                  FROM metafashion.tb_users
                  WHERE leave_yn = 'N'
                  )AS users
            ON followers.user_id = users.id
            WHERE follow_yn = 'Y'
                AND designer_id = ?
          `,
            [
                queryParams.id,
            ]
        );
    }

    /**
     * 사용자 디자이너 Follow Total count 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getUserFollowDesignerTotalCountQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
            COUNT(1) AS totalCount
        FROM metafashion.tb_followers AS follow
        JOIN (select
                  id
                 from tb_designers
                     ) AS designer
        ON follow.designer_id = designer.id
        WHERE user_id = ?
            AND follow_yn = ?
          `,
            [
                queryParams.id,
                YN.Y
            ]
        );
    }

    /**
     * 사용자 디자이너 Follow 전체 Row 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getUserFollowDesignerQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
            designer.id,
            designer.name,
            designer.profile,
            follow.follow_yn
        FROM metafashion.tb_followers AS follow
        JOIN (SELECT
                  id,
                  name,
                 profile
                 FROM metafashion.tb_designers) AS designer
        ON follow.designer_id = designer.id
        WHERE user_id = ?
            AND follow_yn = ?
          `,
            [
                queryParams.id,
                YN.Y
            ]
        );
    }

    /**
     * 사용자 브랜드 Follow Total count 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getUserFollowBrandTotalCountQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
            COUNT(1) AS totalCount
        FROM metafashion.tb_followers AS follow
        JOIN (select
                  id
                 from tb_brands
                     ) AS brand
        ON follow.brand_id = brand.id
        WHERE user_id = ?
            AND follow_yn = ?
          `,
            [
                queryParams.id,
                YN.Y
            ]
        );
    }

    /**
     * 사용자 브랜드 Follow 전체 Row 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getUserFollowBrandQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
          SELECT
            brand.id,
            brand.name,
            brand.profile,
            follow.follow_yn
        FROM metafashion.tb_followers AS follow
        JOIN (SELECT
                  id,
                  name,
                 profile
                 FROM metafashion.tb_brands) AS brand
        ON follow.brand_id = brand.id
        WHERE user_id = ?
            AND follow_yn = ?
          `,
            [
                queryParams.id,
                YN.Y
            ]
        );
    }

    /**
     * 사용자 별 팔로워(디자이너/브랜드 일괄) 조회
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getFindAllAppQuery(queryParams: QueryParams): string {
        return promiseMysql.format(`
                  SELECT
                    'DESIGNER' as type,
                    '' as brand_id,
                    designer.id as designer_id,
                    designer.name,
                    designer.profile,
                    follow.follow_yn,
                    follow.update_date
                FROM metafashion.tb_followers as follow
                JOIN (SELECT
                          id,
                          name,
                         profile
                         FROM metafashion.tb_designers) as designer
                ON follow.designer_id = designer.id
                WHERE user_id = ?
                    AND follow_yn = 'Y'
        UNION ALL
                  SELECT
                    'BRAND' as type,
                    brand.id as brand_id,
                    '' as designer_id,
                    brand.name,
                    brand.profile,
                    follow.follow_yn,
                    follow.update_date
                FROM metafashion.tb_followers as follow
                JOIN (SELECT
                          id,
                          name,
                         profile
                         FROM metafashion.tb_brands) as brand
                ON follow.brand_id = brand.id
                WHERE user_id = ?
                    AND follow_yn = 'Y'
          `,
            [
                queryParams.id, queryParams.id
            ]
        );
    }
}
