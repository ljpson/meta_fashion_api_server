import express from "express";
import {Designer} from "@src/services/designer";
import {Brand} from "@src/services/brand";
import {Follower} from "@src/services/follower";
import {Policy} from "@src/services/policy";
import {Contact} from "@src/services/contact";
import multer from "multer";
import fs from "fs";
import {Config} from "@src/config/config";
import {adminFilter} from "@src/utils/admin_flter";

const DEFAULT_PATH: string = Config.Env.File.FILE_PROFILE_PATH;
const WEB_PROFILE_BASE: string = Config.Env.File.WEB_PROFILE_BASE;
const TEMP_PATH = DEFAULT_PATH + "/designer/temporarily";

const route = express.Router();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const {id} = req.params;
            const fieldName = file.fieldname;

            let path: fs.PathLike;
            if (!!id) {
                path = `${DEFAULT_PATH}/designer/${id}`;
                if (fieldName === 'topProfile') {
                    path = `${DEFAULT_PATH}/designer/${id}/top`;
                }

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
                if (fieldName === 'topProfile') {
                    path = `${path}/top`;
                }
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

// 디자이너 등록
route.post("", checkTempDir, upload.fields([
    {name: "profile"},
    {name: "topProfile"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const designerRequest: DesignerRequest = req.body;

    // 프로필 초기값 빈값 세팅
    designerRequest.profile = '';
    designerRequest.createBy = admin.account;
    return await Designer.save(designerRequest)
        .then(id => {

            let tempPath = TEMP_PATH;
            let newPath = `${DEFAULT_PATH}/designer/${id}`;

            // 폴더명 변경
            fs.renameSync(tempPath, newPath);

            designerRequest.id = Number(id)
            fs.readdirSync(newPath).forEach((file) => {
                designerRequest.profile = `${WEB_PROFILE_BASE}/designer/${id}/${file}`
            });

            // top 디자이너 프로필
            if (designerRequest.topYn === 'Y') {
                fs.readdirSync(`${newPath}/top`).forEach((file) => {
                    designerRequest.topProfile = `${WEB_PROFILE_BASE}/designer/${id}/top/${file}`
                });
            }

            // 프로필 갱신
            Designer.save(designerRequest)
                .catch(e => Designer.fail(res, e));

            Designer.success(res)
        })
        .catch(e => Designer.fail(res, e));
});

// 디자이너 수정
route.post("/:id/save", checkTempDir, upload.fields([
    {name: "profile"},
    {name: "topProfile"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const designerRequest: DesignerRequest = req.body;

    designerRequest.id = Number(req.params.id);
    designerRequest.updateBy = admin.account;
    const files = req.files
    if (!!files) {
        // @ts-ignore
        const profile = files.profile[0]

        // 프로파일 정보 갱신
        designerRequest.profile = `${WEB_PROFILE_BASE}/designer/${designerRequest.id}/${profile.filename}`

        // top 디자이너 정보 갱신
        if (designerRequest.topYn === 'Y') {
            // @ts-ignore
            const topProfile = files.topProfile[0]
            designerRequest.topProfile = `${WEB_PROFILE_BASE}/designer/${designerRequest.id}/top/${topProfile.filename}`
        }
    }

    return await Designer.save(designerRequest)
        .then(_ => Designer.success(res))
        .catch(e => Designer.fail(res, e));
});

// 디자이너 조회
route.get("", async (req: express.Request, res: express.Response) => {
    let queryParams: QueryParams = req.query

    return await Designer.totalCount(queryParams)
        .then(queryParams => Designer.findAll(queryParams)
            .then(designers => {
                const resList: any = [];
                const urlPrefix = `${req.protocol}://${req.get('host')}`

                designers?.forEach((designer) => {
                    resList.push({
                        id: designer.id,
                        name: designer.name,
                        description: designer.description,
                        profile: `${urlPrefix}${designer.profile}`,
                        topYn: designer.topYn,
                        topPosition: designer.topPosition,
                        showYn: designer.showYn,
                        contactAll: designer.contactAll,
                        contactRead: designer.contactRead,
                        followers: designer.followers,
                        createBy: designer.createBy,
                        createDate: designer.createDate,
                        updateBy: designer.updateBy,
                        updateDate: designer.updateDate,
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


// 디자이너 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {

    const id: number = Number(req.params.id);
    return await Designer.findById(id)
        .then(designer => {

            const urlPrefix = `${req.protocol}://${req.get('host')}`

            Designer.findBrandById(id)
                .then(brands => {
                    let result = {
                        id: designer?.id,
                        type: designer?.name,
                        contents: designer?.description,
                        profile: `${urlPrefix}${designer?.profile}`,
                        topYn: designer?.topYn,
                        topProfile: `${urlPrefix}${designer?.topProfile}`,
                        showYn: designer?.showYn,
                        brands: brands,
                        contactAll: designer?.contactAll,
                        contactRead: designer?.contactRead,
                        followers: designer?.followers
                    };

                    Policy.successWithData(res, result)
                })
        });
});


// 디자이너 팔로워 조회
route.get("/:id/followers", async (req: express.Request, res: express.Response) => {
    let queryParams: QueryParams = req.query

    queryParams.id = Number(req.params.id);
    queryParams.type = 'DESIGNER'

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


// 디자이너 메시지 조회
route.get("/:id/contact", async (req: express.Request, res: express.Response) => {
    let queryParams: QueryParams = req.query

    queryParams.id = Number(req.params.id);

    return await Contact.totalCount(queryParams)
        .then(queryParams => Contact.findAll(queryParams)
            .then(contactList => {
                const resList: any = [];

                contactList?.forEach((contact) => {
                    resList.push({
                        id: contact?.id,
                        name: contact.name,
                        account: contact.account,
                        email: contact.email,
                        phone: contact.phone,
                        message: contact.message,
                        readYn: contact.readYn,
                        createDate: contact.createDate,
                        contactRead: contact.contactRead,
                        contactAll: contact.contactAll
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

// 디자이너 메시지 읽음처리
route.post("/:id/contact/:messageId/read", async (req: express.Request, res: express.Response) => {
    let queryParams: QueryParams = req.query

    queryParams.id = Number(req.params.messageId);

    return await Contact.read(queryParams)
        .then(_ => Contact.success(res))
        .catch(e => Contact.fail(res, e));
});

// 디자이너 노출여부변경
route.post("/show", async (req: express.Request, res: express.Response) => {
        const designerRequests: DesignerRequest[] = req.body.data;

        return await Designer.changeShowYnByIds(designerRequests)
            .then(_ => Designer.success(res))
            .catch(e => {
                Designer.fail(res, e)
            });
    }
);

// 탑 디자이너 여부변경
route.post("/top", async (req: express.Request, res: express.Response) => {
        const designerRequests: DesignerRequest[] = req.body.data;

        return await Designer.changeTopYnByIds(designerRequests)
            .then(_ => Designer.success(res))
            .catch(e => {
                Designer.fail(res, e)
            });
    }
);

// 탑 디자이너 순서변경
route.post("/position", async (req: express.Request, res: express.Response) => {
        const designerRequests: DesignerRequest[] = req.body.data;

        return await Designer.changePositionByIds(designerRequests)
            .then(_ => Designer.success(res))
            .catch(e => {
                Designer.fail(res, e)
            });
    }
);

// 디자이너 단건 삭제
route.delete("/:id", async (req: express.Request, res: express.Response) => {
    const id: number = Number(req.params.id);

    return await Designer.delete(id)
        .then(_ => Designer.success(res))
        .catch(e => {
            Designer.fail(res, e)
        });
});

// 디자이너 삭제
route.post("/delete", async (req: express.Request, res: express.Response) => {
        const designerRequest: DesignerRequest[] = req.body.data;

        return await Designer.deleteByIds(designerRequest)
            .then(_ => Designer.success(res))
            .catch(e => {
                Designer.fail(res, e)
            });
    }
);

export default route;
