import express from "express";
import {Policy} from "@src/services/policy";
import {Brand} from "@src/services/brand";
import {Popup} from "@src/services/popup";
import {Config} from "@src/config/config";
import multer from "multer";
import fs from "fs";
import {Designer} from "@src/services/designer";
import {adminFilter} from "@src/utils/admin_flter";

const DEFAULT_PATH: string = Config.Env.File.FILE_POPUP_PATH;
const WEB_PROFILE_BASE: string = Config.Env.File.WEB_POPUP_BASE;
const TEMP_PATH = DEFAULT_PATH + "/temporarily";

const route = express.Router();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const {id} = req.params;

            let path: fs.PathLike;
            if (!!id) {
                path = `${DEFAULT_PATH}/${id}`;

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

route.post("", checkTempDir, upload.fields([
    {name: "image"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const popupRequest: PopupRequest = req.body;

    // 이미지 초기값 빈값 세팅
    popupRequest.image = '';
    popupRequest.createBy = admin.account;
    return await Popup.save(popupRequest)
        .then(id => {

            let tempPath = TEMP_PATH;
            let newPath = `${DEFAULT_PATH}/${id}`;

            // 폴더명 변경
            fs.renameSync(tempPath, newPath);

            popupRequest.id = Number(id)
            fs.readdirSync(newPath).forEach((file) => {
                popupRequest.image = `${WEB_PROFILE_BASE}/${id}/${file}`
            });

            // 프로필 갱신
            Popup.save(popupRequest)
                .catch(e => Designer.fail(res, e));

            Popup.success(res)
        })
        .catch(e => Popup.fail(res, e));
});

// 브랜드 수정
route.post("/:id/save", checkTempDir, upload.fields([
    {name: "image"},
]), adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const popupRequest: PopupRequest = req.body;

    popupRequest.id = Number(req.params.id);
    popupRequest.updateBy = admin.account;
    const files = req.files
    if (!!files) {
        // @ts-ignore
        const image = files.image[0]
        // 프로파일 정보 갱신
        popupRequest.image = `${WEB_PROFILE_BASE}/${popupRequest.id}/${image.filename}`
    }

    return await Popup.save(popupRequest)
        .then(_ => Popup.success(res))
        .catch(e => Popup.fail(res, e));
});

route.get("", async (req: express.Request, res: express.Response) => {
    const accessToken: number = req.body.accessToken;
    const command: string = req.body.command;
    const queryParams: QueryParams = req.query

    return await Popup.totalCount(queryParams)
        .then(queryParams => Popup.findAll(queryParams)
            .then(popups => {
                const resList: any = [];
                const urlPrefix = `${req.protocol}://${req.get('host')}`

                popups?.forEach((popup) => {
                    resList.push({
                        id: popup?.id,
                        title: popup.title,
                        image: `${urlPrefix}${popup.image}`,
                        showFrom: popup.showFrom,
                        showTo: popup.showTo,
                        showYn: popup.showYn,
                        createBy: popup.createBy,
                        createDate: popup.createDate,
                        updateBy: popup.updateBy,
                        updateDate: popup.updateDate,
                        status: popup.status
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

// 팝업 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const accessToken: number = req.body.accessToken;
    const command: string = req.body.command;

    const id: number = Number(req.params.id);
    return await Popup.findById(id)
        .then(popup => {
            const urlPrefix = `${req.protocol}://${req.get('host')}`

            let result = {
                id: popup?.id,
                title: popup?.title,
                image: `${urlPrefix}${popup?.image}`,
                showFrom: popup?.showFrom,
                showTo: popup?.showTo,
                showYn: popup?.showYn,
            };

            Policy.successWithData(res, result)
        });
});

export default route;
