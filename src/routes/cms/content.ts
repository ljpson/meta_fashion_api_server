import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
import {Config} from "@src/config/config";
import {Content} from "@src/services/content";
import {ErrorCode} from "@src/const/error_code";
import {snakeCase} from "change-case";
import {Asset} from "@src/services/asset";
import { v4 } from "uuid";
import {AdminAuthority, AdminStatus} from "@src/models/enums";
import {Admin} from "@src/services/admin";
import {adminFilter} from "@src/utils/admin_flter";

const DEFAULT_PATH: string = Config.Env.File.FILE_CONTENTS_PATH;
const WEB_CONTENTS_BASE: string = Config.Env.File.WEB_CONTENTS_BASE;

const TEMP_PATH = DEFAULT_PATH + "/temporarily";

const route = express.Router();

// multer middleware
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            let path = DEFAULT_PATH;
            path = path + "/temporarily/" + snakeCase(file.fieldname);

            !fs.existsSync(path) && fs.mkdirSync(path, {recursive: true});
            cb(null, path);
        },
        filename(req, file, cb) {
            let fileName;
            if (snakeCase(file.fieldname).startsWith("ar_") ||
                snakeCase(file.fieldname).startsWith("avatar_") ||
                snakeCase(file.fieldname).startsWith("watermark")
            ) {
                fileName = file.originalname;
            } else {
                let extension = path.extname(file.originalname);
                let withoutExtension = path.parse(file.originalname);
                fileName = `${v4()}${extension}`;
            }
            fileName = Buffer.from(fileName, "latin1").toString("utf8");
            cb(null, fileName);
        },
    }),
});

const update = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const {id} = req.params;
            let path = `${DEFAULT_PATH}/${id}`;

            path = `${path}/${snakeCase(file.fieldname)}`;
            !fs.existsSync(path) && fs.mkdirSync(path, {recursive: true});
            cb(null, path);
        },
        filename(req, file, cb) {
            let fileName;
            if (snakeCase(file.fieldname).startsWith("ar_") ||
                snakeCase(file.fieldname).startsWith("avatar_") ||
                snakeCase(file.fieldname).startsWith("watermark")
            ) {
                fileName = file.originalname;
            } else {
                let extension = path.extname(file.originalname);
                let withoutExtension = path.parse(file.originalname);
                fileName = `${v4()}${extension}`;
            }
            fileName = Buffer.from(fileName, "latin1").toString("utf8");
            cb(null, fileName);
        },
    }),
});

// util functions
// temporarily 디렉토리 유무 확인 후 생성
const checkTempDir = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) => {
    try {
        if (fs.existsSync(TEMP_PATH)) {
            fs.rmSync(TEMP_PATH, {recursive: true, force: true});
        }
        fs.mkdirSync(TEMP_PATH, {recursive: true});
        next();
    } catch (e) {
        console.error("directory create error")
    }
};

//디렉토리별 삭제할 파일을 찾아 삭제
const deleteFile = (
    fileList: string[],
    dataList: string[],
    filePath: string,
    dirPath: string,
    fileName: string
) => {
    let removedFileList = fileList.filter((file) => {
        return !dataList.includes(`${filePath}/${file}`) && file.includes(fileName);
    });
    removedFileList.forEach((file) => {
        fs.unlinkSync(`${dirPath}/${file}`);
    });
};

// 파일명 수정
const changeFileName = (dirPath: string, name: string) => {
    let fileList = fs.readdirSync(dirPath);

    fileList.sort(
        (a, b) =>
            fs.statSync(dirPath + "/" + a).ctimeMs -
            fs.statSync(dirPath + "/" + b).ctimeMs
    );

    fileList.forEach((filename, idx) => {
        let pad = "000";
        let strNum = "" + (idx + 1);
        let newFilename: string = "";
        let extension = path.extname(filename);

        newFilename = `${name}${
            pad.substring(0, pad.length - strNum.length) + strNum
        }${extension}`;
        fs.renameSync(`${dirPath}/${filename}`, `${dirPath}/${newFilename}`);
    });
};

// 각 디렉토리에 맞는 파일명으로 수정
const setFileNameByDir = async (id: number) => {
    const dirList = fs.readdirSync(`${DEFAULT_PATH}/${id}`);
    dirList.forEach((dir) => {
        switch (dir) {
            case "top_image":
                changeFileName(`${DEFAULT_PATH}/${id}/top_image`, "top_thumb_");
                break;
            case "concept_image":
                changeFileName(`${DEFAULT_PATH}/${id}/concept_image`, "concept_thumb_");
                break;
            case "detail_image":
                changeFileName(`${DEFAULT_PATH}/${id}/detail_image`, "detail_thumb_");
                break;
            case "media":
                changeFileName(`${DEFAULT_PATH}/${id}/media`, "media_");
                break;
        }
    });
};

// response할 데이터 중 필요한 데이터 문자열 변환
const stringifyBeforeSave = (data: any, newData: any) => {
    data.designer = JSON.stringify(newData.designer);
    data.type = JSON.stringify(newData.type);
    data.tags = JSON.stringify(newData.tags);
    data.assets = JSON.stringify(newData.assets);
    data.thumbnails = JSON.stringify(newData.thumbnails);
    data.concept = JSON.stringify(newData.concept);
    data.media = JSON.stringify(newData.media);
    data.detail = JSON.stringify(newData.detail);
};

// db에 들어갈 디렉토리 url 생성후 데이터 반영
const setDirUrl = async (files: any, id: number, data: any) => {
    for (const [key, values] of Object.entries(files as any)) {
        if (!key.includes("ar")) {
            let directory = `${DEFAULT_PATH}/${id}/${key}`;
            let files = fs.readdirSync(directory);
            let fileDirList = files.map((file) => `/${id}/${key}/${file}`);
            switch (key) {
                case "main":
                    data.thumbnails = fileDirList;
                    break;
                case "concept":
                    data.concept.url = fileDirList;
                    break;
                case "detail":
                    data.detail.url = fileDirList;
                    break;
                case "profile":
                    data.designer.profileUrl = fileDirList[0];
                    break;
            }
        } else {
            let value: any = values;
            let arDirectory = `/${id}/ar/${Buffer.from(
                value[0].originalname,
                "latin1"
            ).toString("utf8")}`;
            switch (key) {
                case "arThumb":
                    data.assets.info.thumbnail = arDirectory;
                    break;
                case "arWatermark":
                    data.assets.info.watermarkUrl = arDirectory;
                    break;
                case "arContent":
                    data.assets.aos.arUrl = arDirectory;
                    data.assets.ios.arUrl = arDirectory;
                    break;
            }
        }
    }
    return data;
};

// 콘텐츠 등록
route.post("", checkTempDir, upload.fields([
    {name: "topImage"},
    {name: "media"},
    {name: "conceptImage"},
    {name: "detailImage"},
    {name: "arContents"},
    {name: "arThumbnail"},
    {name: "avatarContentsFemale"},
    {name: "avatarThumbnailFemale"},
    {name: "avatarContentsMale"},
    {name: "avatarThumbnailMale"},
    {name: "watermark"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const contentRequest: ContentRequest = req.body;
    // data = JSON.parse(data);
    let files = req.files

    // 콘텐츠 디비 저장 후 파일 저장
    contentRequest.createBy = admin.account;
    return await Content.save(contentRequest)
        .then(async id => {

            let tempPath = `${DEFAULT_PATH}/temporarily`;
            let newPath = `${DEFAULT_PATH}/${id}`;

            // 폴더명 변경
            fs.renameSync(tempPath, newPath);

            //각 디렉토리에 따른 파일명 변경
            // await setFileNameByDir(id);

            // 파일 유형별 데이터 저장
            let assetList: AssetDto[] = []
            fs.readdirSync(newPath).forEach((type) => {
                fs.readdirSync(`${newPath}/${type}`).forEach((file) => {
                    assetList.push({
                        contentId: id,
                        type: type.toUpperCase(),
                        filePath: `/resources/contents/${id}/${type}/${file}`
                    });
                });
            });

            // 에셋 저장
            assetList.forEach(asset => {
                asset.createBy = admin.account;
            })
            Asset.saveAll(assetList)
                .catch(e => Asset.fail(res, e));

            Content.success(res)
        })
        .catch(e => Content.fail(res, e));
})

// 콘텐츠 목록 조회
route.get("", adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const queryParams: QueryParams = req.query;

    // 디자이너 권한 관리자 일 경우 디자이너 id 세팅
    if (admin.authority === AdminAuthority.DESIGNER) {
        const loginAdmin = await Admin.findByAccount(admin.account);

        if (!!loginAdmin && !!loginAdmin?.designerId) {
            queryParams.designerId = loginAdmin?.designerId;
        }
    }

    return await Content.totalCount(queryParams)
        .then(queryParams => Content.findAll(queryParams)
            .then(contents => {
                const resList: any = [];

                const urlPrefix = `${req.protocol}://${req.get('host')}`

                contents?.forEach((content) => {
                    resList.push({
                        id: content?.id,
                        categoryId: content.categoryId,
                        categoryName: content.categoryName,
                        designerId: content.designerId,
                        designerName: content.designerName,
                        type: content.type,
                        title: content.title,
                        thumbnail: `${urlPrefix}${content.thumbnail}`,
                        likeCount: content.likeCount,
                        description: content.description,
                        tags: content.tags,
                        contentName: content.contentName,
                        showYn: content.showYn,
                        createBy: content.createBy,
                        createDate: content.createDate,
                        updateBy: content.updateBy,
                        updateDate: content.updateDate
                    });
                });

                if (!!queryParams.totalCount) {
                    res.header("X-Total-count", String(queryParams.totalCount));
                }
                if (!!queryParams.size) {
                    res.header("X-Limit", String(queryParams.size));
                }
                Content.successWithData(res, resList);
            }))
        .catch(e => {
            Content.fail(res, e)
        });
});

// 콘텐츠 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const id: number = Number(req.params.id);
    return await Content.findById(id)
        .then(content => {
            if (content === null) {
                Content.success(res)
            }

            const urlPrefix = `${req.protocol}://${req.get('host')}`
            content!.thumbnail = `${urlPrefix}${content!.thumbnail}`

            Asset.findAllByContentId(id)
                .then(assets => {
                    content!.topImages = []
                    content!.conceptImages = []
                    content!.detailImages = []
                    content!.medias = []

                    assets?.forEach((asset) => {

                        const filePath = `${urlPrefix}${asset.filePath}`
                        switch (asset.type) {
                            case 'TOP_IMAGE':
                                content!.topImages.push({id: asset.id!, path: filePath})
                                break;
                            case 'CONCEPT_IMAGE':
                                content!.conceptImages.push({id: asset.id!, path: filePath})
                                break;
                            case 'DETAIL_IMAGE':
                                content!.detailImages.push({id: asset.id!, path: filePath})
                                break;
                            case 'MEDIA':
                                content!.medias.push({id: asset.id!, path: filePath})
                                break;
                            case 'AR_CONTENTS':
                                content!.arContents = {id: asset.id!, path: filePath}
                                break;
                            case 'AR_THUMBNAIL':
                                content!.arThumbnail = {id: asset.id!, path: filePath}
                                break;
                            case 'AVATAR_CONTENTS_FEMALE':
                                content!.avatarContentsFemale = {id: asset.id!, path: filePath}
                                break;
                            case 'AVATAR_THUMBNAIL_FEMALE':
                                content!.avatarThumbnailFemale = {id: asset.id!, path: filePath}
                                break;
                            case 'AVATAR_CONTENTS_MALE':
                                content!.avatarContentsMale = {id: asset.id!, path: filePath}
                                break;
                            case 'AVATAR_THUMBNAIL_MALE':
                                content!.avatarThumbnailMale = {id: asset.id!, path: filePath}
                                break;
                            case 'WATERMARK':
                                content!.watermark = {id: asset.id!, path: filePath}
                                break;
                        }
                    })
                    Content.successWithData(res, content)
                })
                .catch(e => {
                    Asset.fail(res, e)
                });
        })
        .catch(e => {
            Content.fail(res, e)
        });
});

// 콘텐츠 수정
route.post(
    "/:id/save",
    update.fields([
        {name: "topImage"},
        {name: "media"},
        {name: "conceptImage"},
        {name: "detailImage"},
        {name: "arContents"},
        {name: "arThumbnail"},
        {name: "avatarContentsFemale"},
        {name: "avatarThumbnailFemale"},
        {name: "avatarContentsMale"},
        {name: "avatarThumbnailMale"},
        {name: "watermark"},
    ]),
    adminFilter, async (req: express.Request, res: express.Response) => {
        const admin: AdminRequest = req.body.admin;
        const contentRequest: ContentRequest = req.body;
        const id: number = Number(req.params.id);

        contentRequest.id = id;
        contentRequest.updateBy = admin.updateBy;
        // 콘텐츠 디비 저장 후 파일 삭제 또는 등록
        return await Content.save(contentRequest)
            .then(async _ => {

                let contentPath = `${DEFAULT_PATH}/${id}`;

                // // 폴더명 변경
                // fs.renameSync(tempPath, newPath);

                // 에셋 삭제
                if (!!contentRequest.assetIds) {
                    const ids: number[] = []
                    contentRequest.assetIds.split(",")
                        .forEach(value => {
                            ids.push(Number(value))
                        })

                    const assets = await Asset.findAllByIds(ids)
                    const fileBasePath = DEFAULT_PATH.replace(WEB_CONTENTS_BASE, '')

                    const filePath = `${fileBasePath}`

                    // 파일 삭제
                    assets!.forEach((asset) => {
                        try {
                            const deleteFile = `${filePath}${asset.filePath}`;
                            fs.unlinkSync(deleteFile);
                        } catch(err) {
                            console.error(`file not found :: ${deleteFile}`)
                        }
                    });

                    // DB 삭제
                    await Asset.deleteByIds(assets!)
                }

                // 각 디렉토리에 따른 파일명 변경
                // await setFileNameByDir(id);

                const files = req.files

                // 파일 유형별 데이터 저장
                const updatePath = `${DEFAULT_PATH}/${id}`;
                let assetList: AssetDto[] = []

                if (!!files) {
                    for (const key in files) {
                        const type = snakeCase(key);
                        // @ts-ignore
                        const assetFiles = files[key]
                        // @ts-ignore
                        assetFiles.forEach((assetFile) => {
                            assetList.push({
                                contentId: id,
                                type: type.toUpperCase(),
                                filePath: `/resources/contents/${id}/${type}/${assetFile.filename}`
                            });
                        })
                    }
                }

                // 에셋 저장
                Asset.saveAll(assetList)
                    .catch(e => Asset.fail(res, e));

                Content.success(res)
            })
            .catch(e => Content.fail(res, e));
    }
);

// 콘텐츠 삭제
route.post("/delete", async (req: express.Request, res: express.Response) => {
        const contentRequest: ContentRequest[] = req.body.data;

        return await Content.deleteByIds(contentRequest)
            .then(_ => Content.success(res))
            .catch(e => {
                Content.fail(res, e)
            });
    }
);

// 콘텐츠 노출여부변경
route.post("/show", async (req: express.Request, res: express.Response) => {
        const contentRequest: ContentRequest[] = req.body.data;

        return await Content.changeShowYnByIds(contentRequest)
            .then(_ => Content.success(res))
            .catch(e => {
                Content.fail(res, e)
            });
    }
);

export default route;
