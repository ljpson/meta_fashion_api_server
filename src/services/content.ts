import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";
import {Gender, YN} from "@src/models/enums";
import {Default} from "@src/services/default";

export class Content extends Default{

    /**
     * 콘텐츠 등록
     * @param contentRequest 콘텐츠 파라메터
     */
    public static async save(contentRequest: ContentRequest): Promise<number> {

        let sql: string
        if (!!contentRequest.id) {
            sql = this.getUpdateQuery(contentRequest)
        } else {
            sql = this.getInsertQuery(contentRequest)
        }

        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);

        return res.data[0].insertId;
    }

  public static async insert(
    content: ContentDto
  ): Promise<{ insertResult: boolean; id: number }> {
    const sql: string = promiseMysql.format(
      `
      INSERT INTO metafashion.tb_contents (
        id, category_id, designer_id, type, title, description, tags, content_name, 
        media_description, detail_description, avatar_female_yn, avatar_male_yn, show_yn, delete_yn, create_by, create_date
      ) VALUES (null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, NOW())
    `
    );

    const res: SqlResults = await Mysql.query(sql);
    const insertResult: boolean = res.code === Mysql.Const.SUCCESS;
    const id: number = res.data.insertId;
    return { insertResult, id };
  }

    /**
     * 메시지 전체목록 조회
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
     * 게시글 전체목록 조회
     */
    public static async findAll(queryParams: QueryParams): Promise<ContentDto[] | null> {
        let sql: string = this.getFindAllQuery(queryParams)

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 게시글 상세조회
     */
    public static async findById(id: number): Promise<ContentDto | null> {
        const sql: string = this.getFindByIdQuery(id)

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 게시글 상세조회 - 앱용
     */
    public static async findByIdApp(queryParams: QueryParams): Promise<ContentDto | null> {
        const sql: string = this.getFindByIdAppQuery(queryParams)

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 게시글 브랜드 아이디로 조회
     */
    public static async findByBrandIds(queryParams: QueryParams): Promise<ContentDto[] | null> {
        const sql: string = this.getFindByBrandIdsQuery(queryParams)

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 피드 타입으로 피팅의상 카테고리 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findCategoryByType(queryParams: QueryParams): Promise<CategoryDto[] | null> {
        const sql: string = this.getFindCategoryByTypeQuery(queryParams)

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 피드 타입으로 피팅의상 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findAssetByType(queryParams: QueryParams): Promise<ContentDto[] | null> {
        const sql: string = this.getFindAssetQuery(queryParams)

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * CMS 게시글 수정
     */
    public static async updateById(
    id: number,
    content: ContentDto
  ): Promise<any> {
    const sql: string = this.getUpdateByIdQuery(content, id);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

    public static async selectById(id: number): Promise<any> {
    const sql: string = promiseMysql.format(
      `SELECT * FROM metafashion.tb_contents WHERE content_id=${id} AND deleted = ?`,
      [0]
    );
    const res: any = await Mysql.query(sql);
    return res;
  }

  public static async selectAll(): Promise<ContentDto | null> {
    const sql: string = promiseMysql.format(
      `
      select * from metafashion.tb_contents
      where deleted = ?
      `,
      [0]
    );

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  public static createDeleteQuery(id: number): string {
    return promiseMysql.format(
      `
      UPDATE metafashion.tb_contents SET deleted = ? WHERE content_id = ${id}; 
      `,
      [1]
    );
  }


  public static async deleteById(queryList: string[]): Promise<any | null> {
    const res: SqlResults = await Mysql.transactionQueries(queryList);
    return res;
  }

    /**
     * 콘텐츠 노출여부 변경
     *
     * @param contentRequest[] 콘텐츠 파라메터
     */
    public static async changeShowYnByIds(contentRequest: ContentRequest[]): Promise<void> {

        let queries: string[] = [];
        contentRequest.forEach(brand => {
            queries.push(this.getShowQuery(brand))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 콘텐츠 목록 삭제
     *
     * @param contentRequest[] 콘텐츠 파라메터
     */
    public static async deleteByIds(contentRequest: ContentRequest[]): Promise<void> {

        let queries: string[] = [];
        contentRequest.forEach(content => {
            queries.push(this.getDeleteQuery(content.id))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 콘텐츠 등록 쿼리 리턴
     *
     * @private
     * @param contentRequest 콘텐츠 파라메터
     */
    private static getInsertQuery(contentRequest: ContentRequest): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_contents (
            category_id, designer_id, brand_id, type, title, description, tags, 
            content_name, media_description, concept_description, detail_description, 
            avatar_female_yn, avatar_male_yn, show_yn, delete_yn, create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, NOW(), ?, NOW());
          `,
            [
                Number(contentRequest.categoryId),
                Number(contentRequest.designerId),
                Number(contentRequest.brandId),
                contentRequest.type,
                contentRequest.title,
                contentRequest.description,
                contentRequest.tags,
                contentRequest.contentName,
                contentRequest.mediaDescription,
                contentRequest.conceptDescription,
                contentRequest.detailDescription,
                contentRequest.avatarFemaleYn,
                contentRequest.avatarMaleYn,
                contentRequest.showYn,
                YN.N,
                contentRequest.createBy,
                contentRequest.createBy
            ]
        );
    }

    /**
     * 콘텐츠 업데이트 쿼리 리턴
     *
     * @private
     * @param contentRequest 콘텐츠 파라메터
     */
    private static getUpdateQuery(contentRequest: ContentRequest): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_contents
          SET
            category_id = ?, 
            designer_id = ?, 
            brand_id = ?, 
            type = ?, 
            title = ?, 
            description = ?, 
            tags = ?, 
            content_name = ?, 
            media_description = ?, 
            concept_description = ?, 
            detail_description = ?, 
            avatar_female_yn = ?, 
            avatar_male_yn = ?, 
            show_yn = ?,
            update_by = ?,
            update_date = NOW()
          WHERE id = ?;
          `,
            [
                Number(contentRequest.categoryId),
                Number(contentRequest.designerId),
                Number(contentRequest.brandId),
                contentRequest.type,
                contentRequest.title,
                contentRequest.description,
                contentRequest.tags,
                contentRequest.contentName,
                contentRequest.mediaDescription,
                contentRequest.conceptDescription,
                contentRequest.detailDescription,
                contentRequest.avatarFemaleYn,
                contentRequest.avatarMaleYn,
                contentRequest.showYn,
                contentRequest.updateBy,
                contentRequest.id
            ]
        );
    }

    /**
     * 콘텐츠 Row Count 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getTotalCountQuery(queryParams: QueryParams): string {
        let sql: string =  promiseMysql.format(`
          SELECT
                count(1) AS totalCount
            FROM metafashion.tb_contents as content
            LEFT JOIN (select id, name FROM metafashion.tb_categories
                                  WHERE delete_yn = 'N') AS category
            ON content.category_id = category.id
            LEFT JOIN (SELECT id, name, profile FROM metafashion.tb_designers
                                  WHERE delete_yn = 'N') AS designer
            ON content.designer_id = designer.id
            LEFT JOIN (SELECT id, name FROM metafashion.tb_brands
                                  WHERE delete_yn = 'N') AS brand
            ON content.brand_id = brand.id
            WHERE delete_yn = ?
          `,
            [
                YN.N
            ]
        );
        //APP용은 showYN='Y'가 필수
        if (!!queryParams.App) {
            sql += ` AND content.show_yn = 'Y'`;
        }
        //사용자가 좋아요 한 게시물 검색 - myPage
        if (!!queryParams.myPage) {
            sql += ` AND content.id in ( 
                            select content_id
                            from tb_likes as user_likes
                            where user_likes.user_id= `+ queryParams.userId +`)`;
        }
        //카테고리 검색 - Main
        if (!!queryParams.categoryId) {
            sql += ` AND content.category_id = '`+ queryParams.categoryId + `'`;
        }
        //브랜드별 게시물 검색 - 브랜드 상세페이지
        if (!!queryParams.brandId) {
            sql += ` AND content.brand_id = '`+ queryParams.brandId + `'`;
        }
        //디자이너별 게시물 검색 - 디자이너 상세페이지
        if (!!queryParams.designerId) {
            sql += ` AND content.designer_id = '`+ queryParams.designerId + `'`;
        }
        //피드타입 검색 - Main
        if (!!queryParams.type) {
            sql += ` AND content.type = '`+ queryParams.type + `'`;
        }
        //아바타 성별 검색 - Main
        if (!!queryParams.avatarGender && (queryParams.type == 'AVATAR'|| queryParams.type == 'BOTH')) {
            if (queryParams.avatarGender === Gender.FEMALE) {
                sql += ` AND content.avatar_female_yn = '`+ YN.Y + `'`;
            }
            if (queryParams.avatarGender === Gender.MALE) {
                sql += ` AND content.avatar_male_yn = '`+ YN.Y + `'`;
            }
        }
        //키워드 통합검색 - CMS
        if (!!queryParams.keywords) {
            sql += ` AND brand.name like '${'%' + queryParams.keywords + '%'}' ||`
            sql += `  category.name like '${'%' + queryParams.keywords + '%'}' ||`
            sql += `  designer.name like '${'%' + queryParams.keywords + '%'}'`
        }

        return sql;
    }

    /**
     * 콘텐츠 전체 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getFindAllQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
                SELECT
                    content.id,
                    content.type,
                    avatar_female_yn,
                    avatar_male_yn,
                    title,
                    description,
                    tags,
                    content_name,
                    asset.file_path AS thumbnail,
                    category.id AS category_id,
                    category.name AS category_name,
                    designer.id AS designer_id,
                    designer.name AS designer_name,
                    designer.profile AS designer_profile,
                    brand.name AS brand_name,
                    content.show_yn,
                    IFNULL(contentLike.like_count, 0) AS like_count,
                    likes.like_yn as user_like_yn,
                    content.create_by,
                    content.create_date,
                    content.update_by,
                    content.update_date
                FROM metafashion.tb_contents AS content
                LEFT JOIN (select id, name FROM metafashion.tb_categories
                                      WHERE delete_yn = 'N') AS category
                ON content.category_id = category.id
                LEFT JOIN (SELECT id, name, profile FROM metafashion.tb_designers
                                      WHERE delete_yn = 'N') AS designer
                ON content.designer_id = designer.id
                LEFT JOIN (SELECT id, name FROM metafashion.tb_brands
                                      WHERE delete_yn = 'N') AS brand
                ON content.brand_id = brand.id
                LEFT JOIN (SELECT content_id, COUNT(1) AS like_count
                      FROM metafashion.tb_likes
                      WHERE like_yn = 'Y'
                      GROUP BY content_id) AS contentLike
                ON content.id = contentLike.content_id
                LEFT JOIN tb_likes as likes ON content.id = likes.content_id AND likes.user_id = ?
                LEFT JOIN (SELECT a1.content_id, a1.file_path FROM metafashion.tb_content_assets AS a1
                            JOIN (SELECT 
                                    content_id, min(id) AS id
                               FROM metafashion.tb_content_assets
                                WHERE delete_yn = 'N'
                                    AND type = 'TOP_IMAGE'
                                GROUP BY content_id
                            ) AS a2
                  ON a1.id = a2.id) AS asset
                ON content.id = asset.content_id
                WHERE content.delete_yn = 'N'
    `,
            [queryParams.userId]
        );
        //APP용은 showYN='Y'가 필수
        if (!!queryParams.App) {
            sql += ` AND content.show_yn = 'Y'`;
        }
        //사용자가 좋아요 한 게시물 검색 - myPage
        if (!!queryParams.myPage) {
            sql += ` AND content.id in ( 
                            select content_id
                            from tb_likes as user_likes
                            where user_likes.user_id= `+ queryParams.userId +`)`;
        }
        //카테고리 검색 - Main
        if (!!queryParams.categoryId) {
            sql += ` AND content.category_id = '`+ queryParams.categoryId + `'`;
        }
        //브랜드별 게시물 검색 - 브랜드 상세페이지
        if (!!queryParams.brandId) {
            sql += ` AND content.brand_id = '`+ queryParams.brandId + `'`;
        }
        //디자이너별 게시물 검색 - 디자이너 상세페이지
        if (!!queryParams.designerId) {
            sql += ` AND content.designer_id = '`+ queryParams.designerId + `'`;
        }
        //피드타입 검색 - Main
        if (!!queryParams.type) {
            if (queryParams.type == 'AVATAR' || queryParams.type == 'AR') {
                sql += ` AND (content.type = '`+ queryParams.type + `' OR content.type = 'BOTH') `;
            } else{
                sql += ` AND content.type = '`+ queryParams.type + `'`;
            }
        }
        //아바타 성별 검색 - Main
        if (!!queryParams.avatarGender && (queryParams.type == 'AVATAR'|| queryParams.type == 'BOTH')) {
            if (queryParams.avatarGender === Gender.FEMALE) {
                sql += ` AND content.avatar_female_yn = '`+ YN.Y + `'`;
            }
            if (queryParams.avatarGender === Gender.MALE) {
                sql += ` AND content.avatar_male_yn = '`+ YN.Y + `'`;
            }
        }
        //키워드 통합검색 - CMS
        if (!!queryParams.keywords) {
            sql += ` AND brand.name like '${'%' + queryParams.keywords + '%'}' ||`
            sql += `  category.name like '${'%' + queryParams.keywords + '%'}' ||`
            sql += `  designer.name like '${'%' + queryParams.keywords + '%'}'`
        }
        //정렬 - Main
        if (queryParams.sort == 'LIKE') {
            sql += ` ORDER BY like_count DESC`
        } else {
            sql += ` ORDER BY content.update_date DESC`
        }

        return sql;
    }

    /**
     * 콘텐츠 단건 조회쿼리 리턴
     *
     * @private
     * @param id 콘텐츠 id
     */
    private static getFindByIdQuery(id: number): string {
        return promiseMysql.format(
            `
                SELECT
                    content.id,
                    type,
                    title,
                    description,
                    content_name,
                    tags,
                    category.id AS category_id,
                    category.name AS category_name,
                    media_description,
                    concept_description,
                    detail_description,
                    avatar_female_yn,
                    avatar_male_yn,
                    show_yn,
                    asset.file_path AS thumbnail,
                    designer.id AS designer_id,
                    designer.name AS designer_name,
                    brand.id AS brand_id,
                    brand.name AS brand_name,
                    content.show_yn,
                    IFNULL(contentLike.like_count, 0) AS like_count
                FROM metafashion.tb_contents AS content
                LEFT JOIN (select id, name FROM metafashion.tb_categories
                                      WHERE delete_yn = 'N') AS category
                ON content.category_id = category.id
                LEFT JOIN (SELECT id, name FROM metafashion.tb_designers
                                      WHERE delete_yn = 'N') AS designer
                ON content.designer_id = designer.id
                LEFT JOIN (SELECT id, name FROM metafashion.tb_brands
                                      WHERE delete_yn = 'N') AS brand
                ON content.brand_id = brand.id
                LEFT JOIN (SELECT content_id, COUNT(1) AS like_count
                      FROM metafashion.tb_likes
                      WHERE like_yn = 'Y'
                      GROUP BY content_id) AS contentLike
                ON content.id = contentLike.content_id
                LEFT JOIN (SELECT a1.content_id, a1.file_path FROM metafashion.tb_content_assets AS a1
                            JOIN (SELECT 
                                    content_id, min(id) AS id
                               FROM metafashion.tb_content_assets
                                WHERE delete_yn = 'N'
                                    AND type = 'TOP_IMAGE'
                                GROUP BY content_id
                            ) AS a2
                  ON a1.id = a2.id) AS asset
                ON content.id = asset.content_id
                WHERE content.delete_yn = 'N'
                    AND content.id = ?
    `,
            [id]
        );
    }

    /**
     * 콘텐츠 단건 조회쿼리 리턴 - 앱용
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getFindByIdAppQuery(queryParams: QueryParams): string {
        return promiseMysql.format(
            `
                SELECT
                    content.id,
                    asset.file_path AS thumbnail,
                    likes.like_yn as user_like_yn,
                    IFNULL(contentLike.like_count, 0) AS like_count,
                    type,
                    avatar_female_yn,
                    avatar_male_yn,
                    title,
                    content.description,
                    content_name,
                    tags,
                    media_description,
                    concept_description,
                    detail_description,
                    designer.id AS designer_id,
                    designer.name AS designer_name,
                    designer.profile AS designer_profile,
                    designer.description AS designer_description
                FROM metafashion.tb_contents AS content
                LEFT JOIN (select id, name FROM metafashion.tb_categories
                                      WHERE delete_yn = 'N') AS category
                ON content.category_id = category.id
                LEFT JOIN (SELECT id, name, profile, description FROM metafashion.tb_designers
                                      WHERE delete_yn = 'N') AS designer
                ON content.designer_id = designer.id
                LEFT JOIN (SELECT id, name FROM metafashion.tb_brands
                                      WHERE delete_yn = 'N') AS brand
                ON content.brand_id = brand.id
                LEFT JOIN (SELECT content_id, COUNT(1) AS like_count
                      FROM metafashion.tb_likes
                      WHERE like_yn = 'Y'
                      GROUP BY content_id) AS contentLike
                ON content.id = contentLike.content_id
                LEFT JOIN tb_likes as likes ON content.id = likes.content_id AND likes.user_id = ?
                LEFT JOIN (SELECT a1.content_id, a1.file_path FROM metafashion.tb_content_assets AS a1
                            JOIN (SELECT 
                                    content_id, min(id) AS id
                               FROM metafashion.tb_content_assets
                                WHERE delete_yn = 'N'
                                    AND type = 'TOP_IMAGE'
                                GROUP BY content_id
                            ) AS a2
                  ON a1.id = a2.id) AS asset
                ON content.id = asset.content_id
                WHERE content.delete_yn = 'N'
                    AND content.show_yn = 'Y'
                    AND content.id = ?
    `,
            [queryParams.userId, queryParams.contentId]
        );
    }


    /**
     * 콘텐츠 브랜드 아이디로 조회쿼리 리턴
     *
     * @private
     * @param id 브랜드 ids
     */
    private static getFindByBrandIdsQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
                SELECT
                    content.id,
                    type,
                    title,
                    description,
                    content_name,
                    tags,
                    category.id AS category_id,
                    category.name AS category_name,
                    media_description,
                    concept_description,
                    detail_description,
                    avatar_female_yn,
                    avatar_male_yn,
                    show_yn,
                    asset.file_path AS thumbnail,
                    designer.id AS designer_id,
                    designer.name AS designer_name,
                    designer.profile AS designer_profile,
                    brand.id AS brand_id,
                    brand.name AS brand_name,
                    content.show_yn,
                    IFNULL(contentLike.like_count, 0) AS like_count,
                    likes.like_yn as user_like_yn
                FROM metafashion.tb_contents AS content
                LEFT JOIN (select id, name FROM metafashion.tb_categories
                                      WHERE delete_yn = 'N') AS category
                ON content.category_id = category.id
                LEFT JOIN (SELECT id, name, profile FROM metafashion.tb_designers
                                      WHERE delete_yn = 'N') AS designer
                ON content.designer_id = designer.id
                LEFT JOIN (SELECT id, name FROM metafashion.tb_brands
                                      WHERE delete_yn = 'N') AS brand
                ON content.brand_id = brand.id
                LEFT JOIN (SELECT content_id, COUNT(1) AS like_count
                      FROM metafashion.tb_likes
                      WHERE like_yn = 'Y'
                      GROUP BY content_id) AS contentLike
                ON content.id = contentLike.content_id
                LEFT JOIN tb_likes as likes ON content.id = likes.content_id AND likes.user_id = ?
                LEFT JOIN (SELECT a1.content_id, a1.file_path FROM metafashion.tb_content_assets AS a1
                            JOIN (SELECT 
                                    content_id, min(id) AS id
                               FROM metafashion.tb_content_assets
                                WHERE delete_yn = 'N'
                                    AND type = 'TOP_IMAGE'
                                GROUP BY content_id
                            ) AS a2
                  ON a1.id = a2.id) AS asset
                ON content.id = asset.content_id
                WHERE content.delete_yn = 'N'
    `,
            [queryParams.userId]
        );
        //APP용은 showYN='Y'가 필수
        if (!!queryParams.App) {
            sql += ` AND content.show_yn = 'Y'`;
        }
        //브랜드별 게시물 검색 - 브랜드 리스트
        if (!!queryParams.brandIds) {
            sql += ` AND content.brand_id IN (`+ queryParams.brandIds + `)`;
        }
        sql += ` ORDER BY content.update_date DESC`
        return sql;
    }

    /**
     * 피드 타입으로 피팅의상 카테고리 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    private static getFindCategoryByTypeQuery(queryParams: QueryParams): string {
        let sql: string =
            `
            SELECT
                category.id,
                category.name,
                category.position,
                COUNT(category.id) as asset_count
            FROM tb_contents as content
            LEFT JOIN
                (SELECT
                     content_id,
                     type
                 FROM tb_content_assets
                 WHERE delete_yn='N') as asset
            ON content.id = asset.content_id
            LEFT JOIN
                (SELECT
                     id,
                     name,
                     position
                FROM tb_categories
                WHERE delete_yn='N') as category
            ON content.category_id = category.id
            WHERE content.delete_yn='N'
                AND content.show_yn='Y'
                AND category.id is not null
            `;
        if (!!queryParams.type) {
            sql += ` AND asset.type = '`+ queryParams.type + `'`;
        }
        sql += ` GROUP BY category.id
                 ORDER BY category.position `;

        return promiseMysql.format( sql );
    }

    /**
     * 피드 타입으로 피팅의상 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    private static getFindAssetQuery(queryParams: QueryParams): string {
        let sql: string =
            `
            SELECT
                asset.id,
                content.category_id,
                asset.content_id,
                content.content_name,
                content.avatar_female_yn,
                content.avatar_male_yn,
                asset.type,
                asset2.file_path as contentsFilePath,
                asset.file_path as thumbnailFilePath,
                content.brand_id,
                brand.name as brand_name
            FROM metafashion.tb_content_assets as asset
            JOIN
                (SELECT id,
                        category_id,
                        content_name,
                        avatar_female_yn,
                        avatar_male_yn,
                        brand_id
                FROM tb_contents
                WHERE delete_yn='N'
                    AND show_yn='Y') as content
            ON content.id = asset.content_id
            LEFT JOIN
                (SELECT id,
                        name
                FROM tb_brands) as brand
            ON brand.id = content.brand_id
            LEFT JOIN
                (SELECT content_id,
                        type,
                        file_path
                 FROM tb_content_assets
                 WHERE delete_yn='N') AS asset2
            ON asset2.content_id = asset.content_id
                   AND asset2.type = REPLACE(asset.type, 'THUMBNAIL', 'CONTENTS')
            WHERE asset.delete_yn = 'N'
            `;

        if (!!queryParams.type) {
            sql += ` AND asset.type = '`+ queryParams.type + `'`;
        }
        // 카테고리 별로 조회하게 된다면 필요한 조건
        if (!!queryParams.categoryId) {
            sql += ` AND content.category_id = '`+ queryParams.categoryId + `'`;
        }

        sql += ` ORDER BY asset.create_date desc`;

        return promiseMysql.format( sql );
    }

    /**
     * 콘텐츠 노출여부 변경 쿼리 리턴
     *
     * @private
     * @param contentRequest 콘텐츠 파라메터
     */
    private static getShowQuery(contentRequest: ContentRequest): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_contents
            SET show_yn = ?
            WHERE id = ?;
            `,
            [contentRequest.showYn, contentRequest.id]
        );
    }

    /**
     * CMS 게시글 수정 쿼리 리턴
     *
     * @private
     * @param content
     */
    private static getUpdateByIdQuery(content: ContentDto, id: number) {
        return promiseMysql.format(
            `UPDATE metafashion.tb_contents SET category_id = ?, designer_id = ?, brand_id = ?, type = ?, title = ?, description = ?, tags = ? 
      content_name = ?, media_description = ?, concept_description = ?, detail_description = ?, avatar_female_yn = ?, avatar_male_yn = ?, show_yn = ?, delete_yn = ?, update_by = ?, update_dt = NOW() WHERE content_id= ? `,
            [
                content.categoryId,
                content.designerId,
                content.brandId,
                content.type,
                content.title,
                content.description,
                content.tags,
                content.contentName,
                content.mediaDescription,
                content.conceptDescription,
                content.detailDescription,
                content.avatarFemaleYn,
                content.avatarMaleYn,
                content.showYn,
                content.deleteYn,
                content.updateBy,
                id
            ]
        );
    }

    /**
     * 콘텐츠 삭제쿼리 리턴
     *
     * @private
     * @param id 콘텐츠 id
     */
    private static getDeleteQuery(id: number): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_contents
            SET delete_yn = ?
            WHERE id = ?;
            `,
            [YN.Y, id]
        );
    }
}
