import promiseMysql from "mysql2/promise";
import { Mysql } from "@src/utils/database/mysql";

/**
 * @deprecated policy 로 대체
 */
export class Notice {
  public static async findOne(type: string): Promise<UserDto | null> {
    const sql: string = promiseMysql.format(
      `
      SELECT title, type, description
      FROM metafashion.tb_notices
      WHERE type = ? AND deleted = ? 
      limit 1
    `,
      [type, 0]
    );

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0];
    }
    return null;
  }

  public static async selectAll(type: string): Promise<NoticeDto | null> {
    const sql: string = promiseMysql.format(
      `
      SELECT * FROM metafashion.tb_notices
      WHERE type = ? 
    `,
      [type]
    );

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  // TODO: 쿼리수정
  public static async save(notice: NoticeDto): Promise<boolean> {
    const sql: string = promiseMysql.format(
      `
      INSERT INTO metafashion.tb_categories (
        title, type, description, update_dt, deleted
      ) VALUES (?, ?, ?,  NOW() , 1)
      `,
      [notice.title, notice.type, notice.description]
    );

    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }
}
