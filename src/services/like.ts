import promiseMysql from "mysql2/promise";
import { Mysql } from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Like extends Default {

  /**
   * 좋아요 클릭 (토글)
   *
   * @param like
   */
  public static async save(like: LikeRequest): Promise<void> {
    const sql: string = this.getSaveQuery(like);

    const res: SqlResults = await Mysql.transactionQuery(sql);
    res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
  }

  /**
   * 좋아요 전체목록 조회
   */
  public static async findAll(likeRequest: LikeRequest): Promise<LikeDto[] | null> {
    let sql = this.getFindAllQuery(likeRequest);
    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  /**
   * 좋아요 상세 조회
   */
  public static async getLike(likeRequest: LikeRequest): Promise<LikeRequest> {
    let sql = this.getLikeQuery(likeRequest);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      if (res.data.length > 0) {
        likeRequest.id = res.data[0].id;
        likeRequest.likeYn = res.data[0].likeYn;
      } else {
        likeRequest.id = 0;
        likeRequest.likeYn = "N";
      }
    }
    return likeRequest;
  }

  /**
   * 좋아요 Insert가능한 ID 조회
   */
  public static async getMaxLikeId(): Promise<number> {
    const followId: number = 0;
    let sql: string = this.getMaxLikeIdQuery();
    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0].id;
    }
    return followId;
  }

  /**
   * 사용자 좋아요 전체갯수 조회
   *
   * @param queryParams 쿼리 파라메터
   */
  public static async findAllByUserIdTotalCount(queryParams: QueryParams): Promise<QueryParams> {
    const sql: string = this.getFindAllByUserIdTotalCountQuery(queryParams);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      queryParams.totalCount = res.data[0].totalCount;
    }
    return queryParams;
  }

  /**
   * 사용자 좋아요 전체목록 조회
   */
  public static async findAllByUserId(queryParams: QueryParams): Promise<LikeDto[] | null> {
    const sql: string = this.getFindAllByUserIdQuery(queryParams);

    const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  /**
   * 좋아요 1건 조회
   */
  public static async findById(id: number): Promise<LikeDto | null> {
    const sql = this.getFindByIdQuery(id);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

// CREATE

  /**
   * 좋아요 저장 쿼리 리턴
   *
   * @private
   * @param like 좋아요 파라메터
   */
  private static getSaveQuery(like: LikeRequest): string {
    return promiseMysql.format(
        `
      INSERT INTO metafashion.tb_likes (id, content_id, user_id, like_yn)
      VALUES (?, ?, ?, 'Y')
      ON DUPLICATE KEY
      UPDATE like_yn = (select if(ifnull(max(like_yn),'N')='N','Y','N')
        FROM tb_likes as a
       WHERE id = ? and content_id = ? and user_id = ?);
      `,
        [like.id, like.contentId, like.userId, like.id, like.contentId, like.userId]
    );
  }


  // READ

  /**
   * 팔로잉 테이블 Insert가능한 ID 조회
   *
   * @private
   */
  private static getMaxLikeIdQuery() {
    let sql: string = promiseMysql.format(
        `
                SELECT Max(id)+1 as id
                FROM tb_likes
                `
    );
    return sql;
  }

  /**
   * 사용자 좋아요 Total count 조회
   *
   * @private
   * @param queryParams 쿼리 파라메터
   */
  private static getFindAllByUserIdTotalCountQuery(queryParams: QueryParams): string {
    return promiseMysql.format(
        `
      SELECT
        COUNT(1) AS totalCount
      FROM metafashion.tb_likes AS likes
      JOIN metafashion.tb_contents AS content
        ON likes.content_id = content.id
        WHERE like_yn = 'Y'
        AND user_id = ?;
    `,
        queryParams.userId
    );
  }

  /**
   * 사용자 좋아요 전체목록 조회쿼리 리턴
   *
   * @private
   * @param queryParams 쿼리 파라메터
   */
  private static getFindAllByUserIdQuery(queryParams: QueryParams): string {
    return promiseMysql.format(
        `
      SELECT
        likes.id,
        likes.content_id,
        content.title,
        asset.file_path as thumbnail,   
        user_id AS userId,
        like_yn AS likeYn
      FROM metafashion.tb_likes AS likes
      JOIN metafashion.tb_contents AS content
        ON likes.content_id = content.id
      LEFT JOIN (SELECT content_id, file_path 
                        FROM metafashion.tb_content_assets
                        WHERE delete_yn = 'N'
                        AND type = 'TOP_IMAGE'
        ORDER BY file_path limit 1) AS asset
        ON likes.content_id = asset.content_id
        WHERE like_yn = 'Y'
            AND user_id = ?
        ORDER BY update_date DESC
    `,
        queryParams.userId
    );
  }

  private static getFindAllQuery(likeRequest: LikeRequest) {
    let sql: string = promiseMysql.format(
        `
      SELECT 
        id,
        content_id as contentId,
        user_id as userId,
        like_yn as likeYn
      FROM metafashion.tb_likes
      WHERE 1=1
        `,
        []
    );

    if (!!likeRequest.id) {
      sql += ` AND id = \'` + likeRequest.id + `\'`
    }
    if (!!likeRequest.contentId) {
      sql += ` AND content_id = \'` + likeRequest.contentId + `\'`
    }
    if (!!likeRequest.userId) {
      sql += ` AND user_id = \'` + likeRequest.userId + `\'`
    }
    if (!!likeRequest.likeYn) {
      sql += ` AND like_yn = \'` + likeRequest.likeYn + `\'`
    }
    return sql;
  }

  private static getLikeQuery(likeRequest: LikeRequest) {
    let sql: string = promiseMysql.format(
        `
          SELECT
            id,
            content_id as contentId,
            user_id as userId,
            like_yn as likeYn
          FROM metafashion.tb_likes
          WHERE 1=1
            AND content_id = ?
            AND user_id = ?
        `,
        [likeRequest.contentId, likeRequest.userId]
    );
    return sql;
  }


  private static getFindByIdQuery(id: number) {
    const sql: string = promiseMysql.format(
        `
          SELECT
            id,
            content_id as contentId,
            user_id as userId,
            like_yn as likeYn
          FROM metafashion.tb_likes
          where id = ?
        `,
        id
    );
    return sql;
  }


  // DELETE

  /**
   * 카테고리 단건 사제
   *
   * @param id 카테고리 id
   */
  public static async deleteOne(id: number): Promise<void> {

    const sql: string = promiseMysql.format(
        `
      DELETE FROM metafashion.tb_likes
      WHERE id = ?
    `,
        [id]
    );


    await Mysql.query(sql);
  }
}
