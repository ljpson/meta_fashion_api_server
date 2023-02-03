import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
import { Config } from "@src/config/config";
import { Content } from "@src/services/content";
import { ErrorCode } from "@src/const/error_code";

const DEFAULT_PATH: string = Config.Env.File.FILE_PATH;

const TEMP_PATH = DEFAULT_PATH + "/temporarily";

const route = express.Router();

//multer middleware
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let path = DEFAULT_PATH;
      if (file.fieldname.includes("ar")) {
        path = path + "/temporarily/ar";
      } else {
        path = path + "/temporarily/" + file.fieldname;
      }
      !fs.existsSync(path) && fs.mkdirSync(path);
      cb(null, path);
    },
    filename(req, file, cb) {
      let fileName;
      if (file.fieldname.includes("ar")) {
        fileName = file.originalname;
      } else {
        let extension = path.extname(file.originalname);
        let withoutExtension = path.parse(file.originalname);
        fileName = `${withoutExtension}${Date.now()}${extension}`;
      }
      fileName = Buffer.from(fileName, "latin1").toString("utf8");
      cb(null, fileName);
    },
  }),
});

const update = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const { id } = req.headers;
      let path = `${DEFAULT_PATH}/${id}`;
      if (file.fieldname.includes("ar")) {
        path = path + "/ar";
      } else {
        path = path + "/" + file.fieldname;
      }
      !fs.existsSync(path) && fs.mkdirSync(path);
      cb(null, path);
    },
    filename(req, file, cb) {
      let fileName = file.originalname;
      fileName = Buffer.from(fileName, "latin1").toString("utf8");
      cb(null, fileName);
    },
  }),
});

//util functions
//temporarily 디렉토리 유무 확인 후 생성
const checkTempDir = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (fs.existsSync(TEMP_PATH)) {
    fs.rmSync(TEMP_PATH, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_PATH);
  next();
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

//파일명 수정
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

//각 디렉토리에 맞는 파일명으로 수정
const setFileNameByDir = async (id: number) => {
  const dirList = fs.readdirSync(`${DEFAULT_PATH}/${id}`);
  dirList.forEach((dir) => {
    switch (dir) {
      case "main":
        changeFileName(`${DEFAULT_PATH}/${id}/main`, "top_thumb_");
        break;
      case "concept":
        changeFileName(`${DEFAULT_PATH}/${id}/concept`, "concept_thumb_");
        break;
      case "detail":
        changeFileName(`${DEFAULT_PATH}/${id}/detail`, "detail_thumb_");
        break;
    }
  });
};

//response할 데이터 중 필요한 데이터 문자열 변환
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

//db에 들어갈 디렉토리 url 생성후 데이터 반영
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

route.post("/save", upload.fields([
  { name: "top_image" },
  { name: "concept" },
  { name: "detail" },
  { name: "profile" },
  { name: "arThumb" },
  { name: "arContent" },
  { name: "arWatermark" },
]),async (req: express.Request, res: express.Response) => {
  let { data } = req.body;
  data = JSON.parse(data);

})

route.post(
  "/create",
  checkTempDir,
  upload.fields([
    { name: "main" },
    { name: "concept" },
    { name: "detail" },
    { name: "profile" },
    { name: "arThumb" },
    { name: "arContent" },
    { name: "arWatermark" },
  ]),
  async (req: express.Request, res: express.Response) => {
    let { data } = req.body;
    data = JSON.parse(data);
    try {
      //빈 컬럼 생성 후 id값 반환
      const result: { insertResult: boolean; id: number } =
        await Content.insert(data);
      const { insertResult, id } = result;

      //빈 컬럼 생성이 실패했을 경우
      if (!insertResult) {
        throw new Error("query insert fail");
      }

      //폴더명 변경
      fs.renameSync(`${DEFAULT_PATH}/temporarily`, `${DEFAULT_PATH}/${id}`);

      //각 디렉토리에 따른 파일명 변경
      await setFileNameByDir(id);

      let newData = await setDirUrl(req.files, id, data);

      //필요한 데이터 문자열 변환
      stringifyBeforeSave(data, newData);

      //빈 db에 데이터 업데이트
      const updateResult = await Content.updateById(id, data);

      if (updateResult) {
        return res.status(200).json({
          status: ErrorCode.OK,
          message: "success",
        });
      } else {
        throw new Error("query update fail");
      }
    } catch (err: any) {
      return res.status(200).json({
        status: ErrorCode.QUERY_EXEC_ERROR,
        message: err.message,
      });
    }
  }
);

route.get("/list", async (req: express.Request, res: express.Response) => {
  //모든 컬럼 호출
  const entities: any = await Content.selectAll();
  const resList: any = [];

  //컬럼 리스트 순회하며 데이터 정리
  for (const idx in entities) {
    const content: any = entities[idx];
    resList.push({
      contentId: content.content_id,
      categoryId: content.category_id,
      designer: JSON.parse(content.designer),
      title: content.title,
      description: content.description,
      tags: JSON.parse(content.tags),
      types: JSON.parse(content.types),
      assets: JSON.parse(content.assets),
      thumbnails: JSON.parse(content.thumbnails),
      concept: JSON.parse(content.concepts),
      media: JSON.parse(content.media),
      detail: JSON.parse(content.gallery),
      isShow: Boolean(content.is_show),
      deleted: Boolean(content.deleted),
      regDate: new Date(content.reg_dt).toLocaleDateString(),
      updateDate: new Date(content.update_dt).toLocaleDateString(),
    });
  }

  let contentList: ContentListResponse = {
    status: ErrorCode.OK,
    message: "success",
    command: {
      contents: resList,
    },
  };

  if (entities) {
    return res.status(200).json(contentList);
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: "content save failed",
    });
  }
});

route.post("/detail", async (req: express.Request, res: express.Response) => {
  const { id } = req.body;
  try {
    //id 값에 따른 컬럼 조회
    let result = await Content.selectById(id);
    if (result.data.length === 0) {
      throw new Error("no id");
    }

    const content = result.data[0];
    const { code } = result;

    //response할 데이터 정리
    let responseData = {
      contentId: content.content_id,
      categoryId: content.category_id,
      designer: JSON.parse(content.designer),
      title: content.title,
      description: content.description,
      tags: JSON.parse(content.tags),
      type: JSON.parse(content.types),
      assets: JSON.parse(content.assets),
      thumbnails: JSON.parse(content.thumbnails),
      concept: JSON.parse(content.concepts),
      media: JSON.parse(content.media),
      detail: JSON.parse(content.gallery),
      isShow: Boolean(content.is_show),
      deleted: Boolean(content.deleted),
      regDate: new Date(content.reg_dt).toLocaleDateString(),
      updateDate: new Date(content.update_dt).toLocaleDateString(),
    };

    let contentDetail = {
      status: ErrorCode.OK,
      message: "success",
      command: {
        contents: responseData,
      },
    };

    if (code) {
      return res.status(200).json(contentDetail);
    } else {
      throw new Error("content load failed");
    }
  } catch (err: any) {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: err.message,
    });
  }
});

route.post(
  "/update",
  update.fields([
    { name: "main" },
    { name: "concept" },
    { name: "detail" },
    { name: "profile" },
    { name: "arThumb" },
    { name: "arContent" },
    { name: "arWatermark" },
  ]),
  async (req: express.Request, res: express.Response) => {
    let id = Number(req.headers.id);
    let { data } = req.body;
    let { modified } = req.body;
    data = JSON.parse(data);
    try {
      //전달 받은 modified 배열 | 문자열 확인
      if (modified) {
        if (typeof modified === "string") {
          modified = [modified];
        }

        //modified 배열 순회하며 필드에 따라 디렉토리별 삭제해야 될 파일 확인 후 삭제
        modified.forEach((feild: string) => {
          if (feild.includes("ar")) {
            return;
          }
          let filePath = `/${id}/${feild}`;
          let dirPath = `${DEFAULT_PATH}/${id}/${feild}`;
          let fileList = fs.readdirSync(dirPath);
          switch (feild) {
            case "main":
              deleteFile(
                fileList,
                data.thumbnails,
                filePath,
                dirPath,
                "top_thumb_"
              );
              break;
            case "concept":
              deleteFile(
                fileList,
                data.thumbnails,
                filePath,
                dirPath,
                "concept_thumb_"
              );
              break;
            case "detail":
              deleteFile(
                fileList,
                data.thumbnails,
                filePath,
                dirPath,
                "detail_thumb_"
              );
              break;
          }
        });
      }

      //새로 받은 파일 디렉토리에 따른 이름 수정
      if (req.files) {
        await setFileNameByDir(id);
      }

      //변경된 파일에 따른 url 수정
      let newData = await setDirUrl(req.files, id, data);

      //필요한 데이터 문자열 변환
      stringifyBeforeSave(data, newData);

      //db 업데이트
      const updateResult = await Content.updateById(id, data);

      if (updateResult) {
        return res.status(200).json({
          status: ErrorCode.OK,
          message: "update success",
        });
      } else {
        throw new Error("query update fail");
      }
    } catch (err: any) {
      return res.status(200).json({
        status: ErrorCode.QUERY_EXEC_ERROR,
        message: err.message,
      });
    }
  }
);

route.post("/delete", async (req: express.Request, res: express.Response) => {
  const idList = req.body;
  try {
    let queryList: string[] = [];
    idList.forEach(async (id: number) => {
      let query = Content.createDeleteQuery(id);
      queryList.push(query);
    });

    let result = await Content.deleteById(queryList);
    let { code } = result;
    if (!code) {
      throw new Error("delete fail");
    }

    let contentDetail = {
      status: ErrorCode.OK,
      message: "success",
    };

    return res.status(200).json(contentDetail);
  } catch (err: any) {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: err.message,
    });
  }
});

export default route;
