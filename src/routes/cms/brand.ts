import express from "express";
import {Brand} from "@src/services/brand";
import {Policy} from "@src/services/policy";
import {Follower} from "@src/services/follower";
import {Config} from "@src/config/config";
import multer from "multer";
import fs from "fs";
import {Designer} from "@src/services/designer";
import {adminFilter} from "@src/utils/admin_flter";
import AWS, {S3} from 'aws-sdk';

const DEFAULT_PATH: string = Config.Env.File.FILE_PROFILE_PATH;
const WEB_PROFILE_BASE: string = Config.Env.File.WEB_PROFILE_BASE;
const TEMP_PATH = DEFAULT_PATH + "/brand/temporarily";
let s3: S3;

if (process.env.SERVER_ENV === Config.Const.LOCAL) {
    s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
}

const route = express.Router();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const {id} = req.params;

            let path: fs.PathLike;
            if (!!id) {
                path = `${DEFAULT_PATH}/brand/${id}`;

                // 업로드 파일 이 존재 할 경우 해당 디자이너 프로필 삭제
                try {
                    const dirList = fs.readdirSync(path);
                    dirList.forEach((file) => {
                        fs.unlinkSync(`${path}/${file}`);
                    });
                } catch (e) {
                    console.error(`delete file error :: ${e}`);
                }
            } else {
                path = TEMP_PATH;
            }
            !fs.existsSync(path) && fs.mkdirSync(path, {recursive: true});
            cb(null, path);
        },
        filename(req, file, cb) {
            let fileName = Buffer.from(file.originalname, "latin1").toString("utf8");
            cb(null, fileName);
        },
    }),
});

const checkTempDir = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    try {
        if (fs.existsSync(TEMP_PATH)) {
            fs.rmSync(TEMP_PATH, {recursive: true, force: true});
        }
        const {id} = req.params;
        !id && fs.mkdirSync(TEMP_PATH, {recursive: true});
        next();
    } catch (e) {
        console.error("directory create error")
    }
};

// 브랜드 등록
route.post("", checkTempDir, upload.fields([
    {name: "profile"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const brandRequest: BrandRequest = req.body;

    // 프로필 초기값 빈값 세팅
    brandRequest.profile = '';
    brandRequest.createBy = admin.account;
    return await Brand.save(brandRequest)
        .then(id => {

            let tempPath = TEMP_PATH;
            let newPath = `${DEFAULT_PATH}/brand/${id}`;

            // 폴더명 변경
            fs.renameSync(tempPath, newPath);

            brandRequest.id = Number(id)
            fs.readdirSync(newPath).forEach((file) => {
                brandRequest.profile = `${WEB_PROFILE_BASE}/brand/${id}/${file}`
            });

            // AWS S3환경 일 경우 추가처리
            // if (process.env.SERVER_ENV === Config.Const.TEST) {
            // 개발 임시
            if (process.env.SERVER_ENV === Config.Const.LOCAL) {

            }

            // 프로필 갱신
            Brand.save(brandRequest)
                .catch(e => Designer.fail(res, e));

            Brand.success(res)
        })
        .catch(e => Brand.fail(res, e));
});

// 브랜드 수정
route.post("/:id/save", checkTempDir, upload.fields([
    {name: "profile"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const brandRequest: BrandRequest = req.body;

    brandRequest.id = Number(req.params.id);
    brandRequest.updateBy = admin.account;
    const files = req.files
    if (!!files) {
        // @ts-ignore
        const profile = files.profile[0]
        // 프로파일 정보 갱신
        brandRequest.profile = `${WEB_PROFILE_BASE}/brand/${brandRequest.id}/${profile.filename}`
    }

    return await Brand.save(brandRequest)
        .then(_ => Brand.success(res))
        .catch(e => Brand.fail(res, e));
});

// 브랜드 전체 목록
route.get("", async (req: express.Request, res: express.Response) => {
    let queryParams: QueryParams = req.query

    return await Brand.totalCount(queryParams)
        .then(queryParams => Brand.findAll(queryParams)
            .then(brands => {
                const resList: any = [];
                const urlPrefix = `${req.protocol}://${req.get('host')}`

                brands?.forEach((brand) => {
                    resList.push({
                        id: brand?.id,
                        name: brand.name,
                        profile: `${urlPrefix}${brand.profile}`,
                        followers: brand.followers,
                        showYn: brand.showYn,
                        createBy: brand.createBy,
                        createDate: brand.createDate,
                        updateBy: brand.updateBy,
                        updateDate: brand.updateDate,
                    });
                });

                if (!!queryParams.totalCount) {
                    res.header("X-Total-count", String(queryParams.totalCount));
                }
                if (!!queryParams.size) {
                    res.header("X-Limit", String(queryParams.size));
                }

                Brand.successWithData(res, resList);
            }));
});

// 브랜드 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const id: number = Number(req.params.id);
    return await Brand.findById(id)
        .then(brand => {

            const urlPrefix = `${req.protocol}://${req.get('host')}`

            let result = {
                id: brand?.id,
                type: brand?.name,
                contents: brand?.description,
                profile: `${urlPrefix}${brand?.profile}`,
                followers: brand?.followers,
                showYn: brand?.showYn
            };

            Policy.successWithData(res, result)
        });
});

// 브랜드 팔로워 조회
route.get("/:id/followers", async (req: express.Request, res: express.Response) => {
    const id: number = Number(req.params.id);
    let queryParams: QueryParams = req.query

    queryParams.id = id
    queryParams.type = 'BRAND'

    return await Follower.totalCount(queryParams)
        .then(queryParams => Follower.findAll(queryParams)
            .then(followers => {
                const resList: any = [];

                followers?.forEach((follower) => {
                    resList.push({
                        id: follower?.id,
                        nickname: follower.nickname,
                        email: follower.email,
                        gender: follower.gender
                    });
                });

                if (!!queryParams.totalCount) {
                    res.header("X-Total-count", String(queryParams.totalCount));
                }
                if (!!queryParams.size) {
                    res.header("X-Limit", String(queryParams.size));
                }
                Brand.successWithData(res, resList);
            }));
});


// 브랜드 삭제
route.post("/delete", adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const brandRequest: BrandRequest[] = req.body.data;

    return await Brand.deleteByIds(brandRequest)
        .then(_ => Brand.success(res))
        .catch(e => {
            Brand.fail(res, e)
        });
    }
);

// 브랜드 노출여부변경
route.post("/show", async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const brandRequest: BrandRequest[] = req.body.data;

    return await Brand.changeShowYnByIds(brandRequest)
        .then(_ => Brand.success(res))
        .catch(e => {
            Brand.fail(res, e)
        });
    }
);


export default route;
