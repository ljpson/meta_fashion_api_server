import promiseMysql from "mysql2/promise";
import { Mysql } from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Category extends Default {

  /**
   * 카테고리 목록 저장
   *
   * @param categories
   */
  public static async saveAll(categories: CategoryRequest[]): Promise<void> {
    let queries: string[] = [];

    categories.forEach(category => {
      queries.push(Category.getSaveQuery({
        id: category.id,
        name: category.name,
        position: category.position
      }));
    })

    const res: SqlResults = await Mysql.transactionQueries(queries);
    console.log("save res", res);
    res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
  }

  /**
   * 카테고리 전체목록 조회
   */
  public static async findAll(): Promise<CategoryDto[] | null> {
    const sql: string = this.getFindAllQuery();

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  /**
   * 카테고리 단건 사제
   *
   * @param id 카테고리 id
   */
  public static async deleteOne(id: number): Promise<void> {

    const isUsed = await this.used(id)

    if (isUsed) {
      throw new CustomError(ErrorCode.USED_CATEGORY, "Used Category")
    }

    const sql: string = this.getDeleteQuery(id);

    await Mysql.query(sql);
  }

  /**
   * 카테고리 사용여부 확인
   *
   * @param id 카테고리 id
   * @private
   */
  private static async used(id: number): Promise<boolean> {
    const sql: string = this.getUsedQuery(id);

    const res: SqlResults = await Mysql.query(sql);
    return res.data.length === 1;
  }

  /**
   * Category Batch Query
   *
   * @param category
   * @private
   */
  private static getSaveQuery(category: CategoryDto): string {
    return promiseMysql.format(
        `
      INSERT INTO metafashion.tb_categories (
        id, name, delete_yn, position, create_date, update_date
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY
          UPDATE name = ?, position = ?, update_date = NOW()
      ;`,
        [
          category.id,
          category.name,
          YN.N,
          category.position,
          category.name,
          category.position
        ]
    );
  }

  /**
   * 카테고리 목록 조회쿼리 리턴
   *
   * @private
   */
  private static getFindAllQuery(): string {
    return promiseMysql.format(
        `
      SELECT 
        id,
        name,
        position
      FROM metafashion.tb_categories
      WHERE delete_yn = ?
      ORDER BY position 
    `,
        YN.N
    );
  }

  /**
   * 카테고리 사용여부쿼리 리턴
   *
   * @param id 카테고리 id
   * @private
   */
  private static getUsedQuery(id: number): string {
    return promiseMysql.format(
        `
      SELECT
          *
      FROM metafashion.tb_contents AS content
      JOIN (SELECT id FROM metafashion.tb_categories
                      WHERE delete_yn = 'N') AS category
      ON content.category_id = category.id
      WHERE category_id = ?
        AND delete_yn = 'N'
      LIMIT 1
    `,
        [id]
    );
  }

  /**
   * 카테고리 삭제쿼리 리턴
   *
   * @private
   */
  private static getDeleteQuery(id: number): string {
    return promiseMysql.format(
        `
      UPDATE metafashion.tb_categories
      SET delete_yn = ?, position = 0
      WHERE id = ?
    `,
        [YN.Y, id]
    );
  }
}
