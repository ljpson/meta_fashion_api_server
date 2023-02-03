import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";
import {hashPassword} from "@src/utils";
import {AdminAuthority, AdminStatus, YN} from "@src/models/enums";

export class Admin extends Default {

    /**
     * 관리자 등록
     *
     * @param adminRequest 관리자 파라메터
     */
    public static async save(adminRequest: AdminRequest): Promise<void> {
        let sql: string

        if (!!adminRequest.password) {
            adminRequest.password = await hashPassword(adminRequest.password);
        }
        if (!!adminRequest.authority && adminRequest.authority === AdminAuthority.DESIGNER
            && !adminRequest.designerId) {
            throw new CustomError(ErrorCode.REQUIRED_PARAMETER_NOT_FIND, "Designer id is not found")
        }

        if (!!adminRequest.id) {
            let storedAdmin = await this.findById(adminRequest.id);
            if (!storedAdmin) {
                throw new CustomError(ErrorCode.USER_NOT_FOUND_ERROR, "Account is not found")
            }

            sql = this.getUpdateQuery(this.populate(storedAdmin, adminRequest));
        } else {
            const account = await this.findByAccount(adminRequest.account);
            // 관리자 등록 시 계정 중복 체크
            if (!!account) {
                throw new CustomError(ErrorCode.ALREADY_REGISTERED, "Account is already exists")
            }

            sql = this.getInsertQuery(adminRequest);
        }

        const res: SqlResults = await Mysql.transactionQuery(sql);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 관리자 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
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
     * 관리자 전체목록 조회
     *
     * @param queryParams 쿼리 파라메터
     */
    public static async findAll(queryParams: QueryParams): Promise<AdminDto[] | null> {
        let sql: string = this.getFindAllQuery(queryParams)

        const res: SqlResults = await Mysql.query(this.appendPagination(sql, queryParams));
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 관리자 단건 조회
     *
     * @param id 관리자 id
     */
    public static async findById(id: number): Promise<AdminDto | null> {
        const sql: string = this.getFindByIdQuery(id);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 관리자 계정, 비밀번호로 조회
     *
     * @param account 계정
     */
    public static async findByAccount(account: string): Promise<AdminDto | null> {
        const sql: string = this.getFindByAccountQuery(account);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data[0];
        }
        return null;
    }

    /**
     * 관리자 등록 쿼리 리턴
     * - 최초 등록시 상태 READY, 비밀번호 변경 Y로 설정
     *
     * @private
     * @param adminRequest
     */
    private static getInsertQuery(adminRequest: AdminRequest): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_admins (
            account, name, part, password, authority, designer_id, status, password_change_yn,
                create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,
                ?, NOW(), ?, NOW());
          `,
            [
                adminRequest.account,
                adminRequest.name,
                adminRequest.part,
                adminRequest.password,
                adminRequest.authority,
                adminRequest.designerId,
                AdminStatus.READY,
                YN.Y,
                adminRequest.createBy,
                adminRequest.createBy
            ]
        );
    }

    /**
     * 관리자 업데이트 쿼리 리턴
     *
     * @private
     * @param adminDto 팝업 파라메터
     */
    private static getUpdateQuery(adminDto: AdminDto): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_admins
          SET
            part = ?, 
            password = ?, 
            authority = ?, 
            designer_id = ?, 
            status = ?,
            password_change_yn = ?,
            update_by = ?,
            update_date = NOW()
          WHERE id = ?;
          `,
            [
                adminDto.part,
                adminDto.password,
                adminDto.authority,
                adminDto.designerId,
                adminDto.status,
                adminDto.passwordChangeYn,
                adminDto.updateBy,
                adminDto.id
            ]
        );
    }

    /**
     * 관리자 Row Count 조회쿼리 리턴
     *
     * @private
     * @param queryParams
     */
    private static getTotalCountQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
      SELECT
          COUNT(1)
      FROM metafashion.tb_admins AS admin
    `
        );

        if (!!queryParams.keywords) {
            sql += ` WHERE admin.type like '${'%' + queryParams.keywords + '%'}' ||`
            sql += ` admin.name like '${'%' + queryParams.keywords + '%'}' ||`
            sql += ` admin.id like '${'%' + queryParams.keywords + '%'}' ||`
            sql += ` admin.update_by like '${'%' + queryParams.keywords + '%'}'`
        }

        return sql;
    }

    /**
     * 관리자 목록 조회쿼리 리턴
     *
     * @private
     * @param queryParams 쿼리 파라메터
     */
    private static getFindAllQuery(queryParams: QueryParams): string {
        let sql: string = promiseMysql.format(
            `
      SELECT
          id,
        account,
        name,
        part,
        authority,
        status,
        update_by,
        update_date
      FROM metafashion.tb_admins AS admins
    `
        );

        if (!!queryParams.keywords) {
            sql += ` WHERE admin.type like '${'%' + queryParams.keywords + '%'}' ||`
            sql += ` admin.name like '${'%' + queryParams.keywords + '%'}' ||`
            sql += ` admin.id like '${'%' + queryParams.keywords + '%'}' ||`
            sql += ` admin.update_by like '${'%' + queryParams.keywords + '%'}'`
        }

        sql += ` ORDER BY create_date DESC`

        return sql;
    }

    /**
     * 관리자 단건 조회쿼리 리턴
     *
     * @private
     * @param id 관리자 id
     */
    private static getFindByIdQuery(id: number): string {
        return promiseMysql.format(
            `
      SELECT 
        id,
        account,
        password,
        name,
        part,
        authority,
        status,
        password_change_yn,
        update_by,
        update_date
      FROM metafashion.tb_admins
      WHERE id = ?
    `,
            id
        );
    }

    /**
     * 관리자 계정, 비밀번호로 조회쿼리 리턴
     *
     * @private
     * @param account 계정
     * @param password 비밀번호
     */
    private static getFindByAccountQuery(account: string): string {
        return promiseMysql.format(
            `
      SELECT 
        id,
        account,
        password,
        name,
        part,
        authority,
        designer_id,
        status,
        password_change_yn,
        update_by,
        update_date
      FROM metafashion.tb_admins
      WHERE account = ?
    `,
            account
        );
    }

    /**
     * 저장된 정보와 변경된 정보 병합
     *
     * @param storedDto 저장된 데이터
     * @param adminRequest 변경요청 데이터
     * @private
     */
    private static populate(storedDto: AdminDto, adminRequest: AdminRequest): AdminDto {

        // 변경내역 체크
        for (const key in storedDto) {
            // @ts-ignore
            if (!!adminRequest[key]) {
                // @ts-ignore
                storedDto[key] = storedDto[key] === adminRequest[key] ? storedDto[key] : adminRequest[key];
            }
        }

        return storedDto;
    }
}
