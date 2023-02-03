import promiseMysql from 'mysql2/promise';
import { Mysql } from '@src/utils/database/mysql';
import {logger} from "@src/utils/logger";
import { Response } from 'express';
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";
import {LeaveType, YN} from "@src/models/enums";

export class User extends Default {

  /**
   * 사용자 등록
   *
   * @param userRequest 사용자 파라메터
   */
  public static async save(userRequest: UserRequest): Promise<void> {
    let sql: string = this.getUpdateQuery(userRequest)

    const res: SqlResults = await Mysql.transactionQuery(sql);
    console.log("save res", res);
    res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
  }

  public static async register(user: RegisterDto): Promise<null> {
    const sql: string = promiseMysql.format(`
      INSERT INTO metafashion.tb_users (
        email, password, role, access_token, channel_id, device_id, provider, nickname, update_dt, reg_dt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      user.email, user.password, 'admin' , user.accessToken, user.channelId, user.deviceId, user.provider, user.nickname
    ]);

    const res: SqlResults = await Mysql.query(sql);

    if (res.code === Mysql.Const.SUCCESS) {
      return res.data.insertId;
    }
    return null;
  }

  public static async saveGoogleUser(userRequest: UserRequest): Promise<null> {
    let sql: string = this.getSaveGoogleUserQuery(userRequest);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  public static async updateLastLogin(user: UserDto): Promise<null> {
    let sql: string = this.getUpdateLastLoginQuery(user);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  /**
   * 사용자 Total count 조회
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
   * 사용자 전체목록 조회
   *
   * @param queryParams 쿼리 파라메터
   */
  public static async findAll(queryParams: QueryParams): Promise<UserDto[] | null> {
    let sql: string = this.getFindAllQuery(queryParams);

    const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  /**
   * 사용자 단건 조회
   *
   * @param id 사용자 id
   */
  public static async findById(id: number): Promise<UserDto | null> {
    const sql: string = this.getFindById(id);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0];
    }
    return null;
  }

  public static async findOneChannel(chnanelId: string): Promise<UserDto | null> {
    const sql: string = promiseMysql.format(`
      SELECT account_id as accountId, email, password, channel_id as channelId,
             provider, platform, username, nickname, push_allow as pushAllow,
             policy_allow as policyAllow
      FROM metafashion.tb_users
      WHERE channelId = ? AND deleted = ? 
      limit 1
    `, [chnanelId, 0]);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0];
    }
    return null;
  }

  public static async findOneByEmail(email: string): Promise<UserDto | null> {
    const sql: string = promiseMysql.format(`
      SELECT id, email, nickname, gender, profile, device_id, provider, platform, leave_yn, leave_type
        FROM metafashion.tb_users
       WHERE email = ?
         AND (leave_yn is null OR leave_yn != ?)
       LIMIT 1
    `, [email, 'Y']);

    const res: SqlResults = await Mysql.query(sql);

    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0];
    }
    return null;
  }

  public static async findOneByChannelId
  (channelId: string): Promise<UserDto | null> {
    const sql: string = promiseMysql.format(`
      SELECT account_id as accountId, email, channel_id as channelId,
             provider, platform, username, nickname, policy_allow as policyAllow
      FROM metafashion.tb_users
      WHERE channel_id = ? AND leave_yn = ?
      LIMIT 1
    `, [channelId, 'N']);

    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data[0];
    }
    return null;
  }

  public static async findOneByDeviceId(deviceId: string): Promise<any> {
    const sql: string = promiseMysql.format(`
      select *
      from metafashion.tb_users
      where device_id = ?
      limit 1
    `, [deviceId]);
    const res: SqlResults = await Mysql.query(sql);
    if (res.code === Mysql.Const.SUCCESS) {
      return res.data;
    }
    return null;
  }

  public static async patchPushAllow
  (accountId: number, allow: boolean, currentTime: number): Promise<boolean> {
    const allowToNum: number = allow ? 1: 0;
    const sql: string = promiseMysql.format(`
      update metafashion.tb_users
      set push_allow = ?, push_allow_dt = ?
      where account_id = ?
    `, [allowToNum, currentTime, accountId]);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async patchPolicyAllow
  (accountId: number, allow: boolean, currentTime: number): Promise<boolean> {
    const allowToNum: number = allow ? 1: 0;
    const sql: string = promiseMysql.format(`
      update metafashion.tb_users
      set policy_allow = ?, policy_allow_dt = ?
      where account_id = ?
    `, [allowToNum, currentTime, accountId]);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async patchPushToken
  (accountId: number, token: string): Promise<boolean> {
    const sql: string = promiseMysql.format(`
      update metafashion.tb_users
      set push_token = ?
      where account_id = ?
    `, [token, accountId]);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async isNicknameDuplicated(nickname: string): Promise<boolean> {
    const sql: string = promiseMysql.format(`
      select nickname
      from metafashion.tb_users
      where nickname = ?
      limit 1
    `, [nickname]);
    const res: SqlResults = await Mysql.query(sql);
    return res.data.length === 1;
  }

  public static async patchNickname
  (accountId: number, nickname: string): Promise<boolean> {
    const sql: string = promiseMysql.format(`
      update metafashion.tb_users
      set nickname = ?
      where account_id = ?
    `, [nickname, accountId]);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async patchPassword
  (accountId: number, password: string): Promise<boolean> {
    const sql: string = promiseMysql.format(`
      UPDATE metafashion.tb_users
      SET password = ?
      WHERE account_id = ?
    `, [password, accountId]);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async patchLoginInfo(user: UserDto): Promise<boolean> {
    const current: number = Date.now();
    let sql: string;
    if (user.pushToken) {
      sql = promiseMysql.format(`
      UPDATE metafashion.tb_users
      SET last_login = ?, device_id = ?, platform = ?,
          push_token = ?, push_token_dt = ?
      WHERE account_id = ?
    `, [
        current, user.deviceId, user.platform,
        user.pushToken, current, user.id
      ]);
    } else {
      sql = promiseMysql.format(`
      UPDATE metafashion.tb_users
      SET last_login = ?, device_id = ?, platform = ?
      WHERE account_id = ?
    `, [current, user.deviceId, user.platform, user.id]);
    }

    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async patchLogoutInfo(id: number): Promise<boolean> {
    //const current: number = Date.now();
    const sql: string = promiseMysql.format(`
      UPDATE metafashion.tb_users
      SET last_logout = now()
      WHERE id = ?
    `, [id]);
    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async deleteOne(accountId: number): Promise<boolean> {
    const sql: string = promiseMysql.format(`
        update metafashion.tb_users
        set deleted = ?
        where account_id = ?
    `, [1, accountId]);

    const res: SqlResults = await Mysql.query(sql);
    return res.code === Mysql.Const.SUCCESS;
  }

  public static async getToken(accountId: number): Promise<string> {
    const account = accountId + 'accountId';
    logger.info('account:', account);
    return account;
  }

  /**
   * 사용자 탈퇴처리 (Admin)
   *
   * @param userRequest 사용자 파라메터
   */
  public static async leaveByAdmin(userRequest: UserRequest[]): Promise<void> {
    let queries: string[] = [];

    userRequest.forEach(userRequest => {
      queries.push(this.getLeaveByAdminQuery(userRequest));
    })

    const res: SqlResults = await Mysql.transactionQueries(queries);
    console.log("save res", res);
    res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
  }

  /**
   * 사용자 탈퇴처리 (Self)
   *
   * @param userRequest 사용자 파라메터
   */
  public static async leaveBySelf(userRequest: UserRequest): Promise<void> {
    let sql: string = this.getLeaveBySelfQuery(userRequest);

    const res: SqlResults = await Mysql.query(sql);
    console.log("save res", res);
    res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
  }


  /**
   * 사용자 등록 쿼리 리턴
   *
   * @private
   * @param userRequest 사용자 파라메터
   */
  private static getInsertQuery(userRequest: UserRequest): string {
    return promiseMysql.format(`
          INSERT INTO metafashion.tb_users (
            email, password, nickname, gender, profile, device_id, provider, platform,
                create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?, ?, ?,
                ?, NOW(), ?, NOW());
          `,
        [
          userRequest.email,
          userRequest.password,
          userRequest.nickname,
          userRequest.gender,
          userRequest.profile,
          userRequest.deviceId,
          userRequest.provider,
          userRequest.platform,
          '임시',
          '임시'
        ]
    );
  }

  /**
   * 사용자 Total count 조회쿼리 리턴
   *
   * @private
   * @param queryParams 쿼리 파라메터
   */
  private static getTotalCountQuery(queryParams: QueryParams): string {
    let sql: string = promiseMysql.format(
        `
      SELECT
          COUNT(1) AS totalCount
      FROM metafashion.tb_users AS user
    `
    );

    if (!!queryParams.keywords) {
      sql += ` WHERE user.nickname like '%${queryParams.keywords}%' ||`;
      sql += ` user.email like '%${queryParams.keywords}%'`;
    }

    return sql;
  }

  /**
   * 사용자 전체목록 조회쿼리 리턴
   *
   * @private
   * @param queryParams 쿼리 파라메터
   */
  private static getFindAllQuery(queryParams: QueryParams): string {
    let sql: string = promiseMysql.format(
        `
      SELECT
          id,
          email,
          nickname,
          profile,
          gender,
          IF(leave_yn = 'Y', 'LEAVE', 'JOIN')status,
          create_date,
          last_login,
          leave_by,
          leave_date,
          admin.name AS leave_by_name
      FROM metafashion.tb_users AS user
      LEFT JOIN
          (SELECT
               account,
               name
           FROM tb_admins) AS admin
      ON user.leave_by = admin.account
    `
    );

    if (!!queryParams.keywords) {
      sql += ` WHERE user.nickname like '%${queryParams.keywords}%' ||`
      sql += ` user.email like '%${queryParams.keywords}%' ||`
    }

    if (!!queryParams.email) {
      sql += ` user.email = '${queryParams.email}'`
    }

    sql += ` ORDER BY create_date DESC`

    return sql;
  }

  /**
   * 사용자 단건 조회쿼리 리턴
   *
   * @private
   * @param id 사용자 id
   */
  private static getFindById(id: number): string {
    return promiseMysql.format(
        `
      SELECT 
        id,
        email,
        nickname,
        profile,
        gender
      FROM metafashion.tb_users
      WHERE id = ?
    `,
        id
    );
  }

  /**
   * 사용자 업데이트 쿼리 리턴
   *
   * @private
   * @param userRequest 사용자 파라메터
   */
  private static getUpdateQuery(userRequest: UserRequest): string {
    return promiseMysql.format(`
          UPDATE metafashion.tb_users
          SET
            part = ?, 
            password = ?, 
            authority = ?, 
            status = ?,
            update_by = ?,
            update_date = NOW()
          WHERE id = ?;
          `,
        [
          // userRequest.part,
          // userRequest.password,
          // userRequest.authority,
          // userRequest.status,
          // '임시',
          // userRequest.id
        ]
    );
  }

  /**
   * 사용자 탈퇴 쿼리 리턴 - Admin
   *
   * @privatel
   * @param userRequest 사용자 파라메터
   */
  private static getLeaveByAdminQuery(userRequest: UserRequest): string {
    return promiseMysql.format(`
          UPDATE metafashion.tb_users
          SET
            update_by = ?,
            leave_yn = ?,
            leave_type = ?,
            leave_date = NOW(), 
            leave_by = ? 
          WHERE id = ?
          `,
        [
          userRequest.updateBy,
          YN.Y,
          LeaveType.ADMIN,
          userRequest.updateBy,
           userRequest.id
        ]
    );
  }

  /**
   * 사용자 탈퇴 쿼리 리턴 - Self
   *
   * @privatel
   * @param userRequest 사용자 파라메터
   */
  private static getLeaveBySelfQuery(userRequest: UserRequest): string {
    return promiseMysql.format(`
          UPDATE metafashion.tb_users
          SET
            leave_yn = ?,
            leave_type = ?,
            leave_date = NOW(), 
            leave_by = ? 
          WHERE id = ?
          `,
        [
          YN.Y,
          LeaveType.SELF,
          '',
          userRequest.id
        ]
    );
  }

  private static getUpdateLastLoginQuery(user: UserDto): string {
    return promiseMysql.format(`
      UPDATE metafashion.tb_users
         SET profile = ?,
             last_login = NOW()
       WHERE email = ?
    `,
        [user.profile, user.email]
    );
  }

  private static getSaveGoogleUserQuery(userRequest: UserRequest): string {
    return promiseMysql.format(`
      INSERT INTO metafashion.tb_users (id, email, nickname, gender, profile, provider, create_date)
           VALUES (?, ?, ?, ?, ?, 'google', now())
               ON DUPLICATE KEY UPDATE nickname = ?,
                                       gender = ?,
                                       profile = ?,
                                       update_date = now()
    `,
        [userRequest.id, userRequest.email, userRequest.nickname, userRequest.gender, userRequest.profile, userRequest.nickname, userRequest.gender, userRequest.profile]
    );
  }
}