import { mysqlPool } from "@src/app";
import promiseMysql from "mysql2/promise";
import has from "has";
import {camelCase} from "change-case";

export class Mysql {
  public static Const = class {
    public static readonly SUCCESS: number = 1;
    public static readonly FAIL: number = 0;
  };

  public static async query(
    query: string,
    params: any[] = []
  ): Promise<SqlResults> {
    try {
      const connection: promiseMysql.PoolConnection =
        await mysqlPool.getConnection();
      try {
        const rows: any[] = await connection.query(query, params);
        return {
          code: this.Const.SUCCESS,
          message: "",
          data: this.changeCase(rows[0]),
        };
      } catch (err) {
        console.error(`exec mysql query failed: ${err}`);

        return {
          code: this.Const.FAIL,
          message: "QUERY EXEC FAIL",
        };
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error(`connect mysql failed: ${err}`);
      return {
        code: this.Const.FAIL,
        message: "MYSQL CONNECTION FAIL",
      };
    }
  }

  // 트랜젝션 query
  public static async transactionQuery(
    query: string,
    params: any[] = []
  ): Promise<SqlResults> {
    try {
      const connection: promiseMysql.PoolConnection =
        await mysqlPool.getConnection();
      try {
        await connection.beginTransaction();
        console.log("query??", query);
        const rows: any[] = await connection.query(query, params);
        await connection.commit();
        return {
          code: this.Const.SUCCESS,
          message: "",
          data: rows,
        };
      } catch (exception) {
        await connection.rollback();
        return {
          code: this.Const.FAIL,
          message: "TRANSACTIOM QUERY EXEC FAIL",
        };
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error(`connect mysql failed: ${err}`);
      return {
        code: this.Const.FAIL,
        message: "MYSQL CONNECTION FAIL",
      };
    }
  }

  public static async transactionQueries(queries: string[]) {
    let query: string = "";
    const count: number = queries.length;
    for (let idx: number = 0; idx < count; ++idx) {
      query += queries[idx];
    }
    return await this.transactionQuery(query);
  }

  private static changeCase(rows: any) {
    const convertedRow = []

    for (const row in rows) {
      const converted: { [key: string]: any } = {};
      for (const prop in rows[row]) {
        if (has(rows[row], prop)) {
          converted[camelCase(prop)] = rows[row][prop];
        }
      }
      convertedRow.push(converted)
    }
    return convertedRow
  }
}
