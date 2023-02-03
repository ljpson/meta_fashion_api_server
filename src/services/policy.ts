import promiseMysql from "mysql2/promise";
import { Mysql } from "@src/utils/database/mysql";
import {Default} from "@src/services/default";

export class Policy extends Default {

  /**
   * 정책 저장
   *
   * @param policyRequest 정책 파라메터
   */
  // TODO: 작성자 토큰정보 또는 디비정보로 등록
  public static async save(policyRequest: PolicyRequest): Promise<boolean> {
    const sql: string = this.getSaveQuery(policyRequest)

    const res: SqlResults = await Mysql.transactionQuery(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  /**
   * 타입별 정책 조회
   *
   * @param type 정책 타입 {USE, PRIVACY}
   */
  public static async findByType(type: string): Promise<PolicyDto[] | null> {
    const sql: string = this.getFindByType(type);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  /**
   * 정책 단건 조회
   * @param id 정책 id
   */
  public static async findById(id: number): Promise<PolicyDto | null> {
    const sql: string = this.getFindById(id);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0];
    }
    return null;
  }

  /**
   * 정책 저장쿼리 리턴
   *
   * @private
   * @param policy 정책 파라메터
   */
  private static getSaveQuery(policy: PolicyRequest): string {
    return promiseMysql.format(
        `
      INSERT INTO metafashion.tb_policies (
        type, contents, show_from, show_to, create_by, create_date
      ) VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY
          UPDATE type = ?, contents = ?, show_from = ?, show_to = ?
      `,
        [policy.type, policy.contents, policy.showFrom, policy.showTo,
          policy.type, policy.contents, policy.showFrom, policy.showTo, policy.createBy]
    );
  }

  /**
   * 타입별 정책 조회쿼리 리턴
   *
   * @private
   * @param type 정책 타입
   */
  private static getFindByType(type: string): string {
    return promiseMysql.format(
        `
      SELECT 
        id,
        type,
        contents,
        show_from,
        show_to
      FROM metafashion.tb_policies
      WHERE type = ?
      ORDER BY show_from DESC
    `,
        type
    );
  }

  /**
   * 정책 단건 조회쿼리 리턴
   *
   * @private
   * @param id 정책 id
   */
  private static getFindById(id: number): string {
    return promiseMysql.format(
        `
      SELECT 
        id,
        type,
        contents,
        show_from,
        show_to
      FROM metafashion.tb_policies
      WHERE id = ?
    `,
        id
    );
  }
}
