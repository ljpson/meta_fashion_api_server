import promiseMysql from "mysql2/promise";
import {Mysql} from "@src/utils/database/mysql";
import {YN} from "@src/models/enums";
import {Default} from "@src/services/default";
import {CustomError} from "@src/errors/CustomError";
import {ErrorCode} from "@src/const/error_code";

export class Asset extends Default {

    /**
     * 에셋 등록
     *
     * @param assets 에셋 Dto
     */
    public static async saveAll(assets: AssetDto[]): Promise<void> {
        let queries: string[] = [];

        assets.forEach(asset => {
            queries.push(Asset.getInsertQuery(asset));
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS ! || new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 에셋 전체목록 조회
     *
     * @param contentId 콘텐츠 id
     */
    public static async findAllByContentId(contentId: number): Promise<AssetDto[] | null> {
        let sql: string = this.getFindAllByContentIdQuery(contentId);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 에셋 아이디로 목록 조회
     *
     * @param ids 에셋 ids
     */
    public static async findAllByIds(ids: number[]): Promise<AssetDto[] | null> {
        let sql: string = this.getFindAllByIdsQuery(ids);

        const res: SqlResults = await Mysql.query(sql);
        if (res.code === Mysql.Const.SUCCESS) {
            return res.data;
        }
        return null;
    }

    /**
     * 파일 다건 삭제
     *
     * @param assetDtos 에셋 목록
     */
    public static async deleteByIds(assetDtos: AssetDto[]): Promise<void> {

        let queries: string[] = [];
        assetDtos.forEach(asset => {
            queries.push(this.getDeleteQuery(asset.id!))
        })

        const res: SqlResults = await Mysql.transactionQueries(queries);
        console.log("save res", res);
        res.code === Mysql.Const.SUCCESS !|| new CustomError(ErrorCode.QUERY_EXEC_ERROR);
    }

    /**
     * 에셋 등록 쿼리 리턴
     *
     * @private
     * @param assetDto
     */
    private static getInsertQuery(assetDto: AssetDto): string {
        return promiseMysql.format(`
          INSERT INTO metafashion.tb_content_assets (
            content_id, type, file_path, delete_yn, 
                create_by, create_date, update_by, update_date
          ) VALUES (?, ?, ?, ?,
                ?, NOW(), ?, NOW());
          `,
            [
                assetDto.contentId,
                assetDto.type,
                assetDto.filePath,
                YN.N,
                assetDto.createBy,
                assetDto.createBy
            ]
        );
    }

    /**
     * 에셋 목록 조회쿼리 리턴
     *
     * @private
     * @param contentId 콘텐츠 id
     */
    private static getFindAllByContentIdQuery(contentId: number): string {
        return promiseMysql.format(
            `
          SELECT
              id,
              content_id,
              type,
              file_path
          FROM metafashion.tb_content_assets AS asset
          WHERE asset.delete_yn = 'N'
            AND content_id = ?
          ORDER BY file_path, type
        `, contentId
        );
    }

    /**
     * 에셋 아이디로 목록 조회쿼리 리턴
     *
     * @private
     * @param ids 에셋 ids
     */
    private static getFindAllByIdsQuery(ids: number[]): string {
        return promiseMysql.format(
            `
          SELECT
              id,
              content_id,
              type,
              file_path
          FROM metafashion.tb_content_assets AS asset
          WHERE asset.delete_yn = 'N'
            AND id IN (?)
          ORDER BY file_path, type
        `, [ids]
        );
    }

    /**
     * 에셋 업데이트 쿼리 리턴
     *
     * @private
     * @param asset 에셋 dto
     */
    private static getUpdateQuery(asset: AssetDto): string {
        return promiseMysql.format(`
          UPDATE metafashion.tb_content_assets
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
                asset.contentId,
                asset.filePath,
                '임시',
                asset.id
            ]
        );
    }

    /**
     * 에셋 삭제쿼리 리턴
     *
     * @private
     * @param id
     */
    private static getDeleteQuery(id: number): string {
        return promiseMysql.format(
            `
            UPDATE metafashion.tb_content_assets
            SET delete_yn = ?
            WHERE id = ?;
            `,
            [YN.Y, id]
        );
    }


}
