import IORedis from "ioredis";
import mysql from "mysql2/promise";
import path from "path";

export class EnvLocal {
  public static readonly Google = class {
    public static readonly CLIENT_ID_WEB: string = process.env
      .GOOGLE_CLIENT_ID as string;
    public static readonly CLIENT_ID_IOS: string = process.env
      .GOOGLE_CLIENT_ID_IOS as string;
    public static readonly CLIENT_ID_ANDROID: string = process.env
      .GOOGLE_CLIENT_ID_ANDROID as string;
  };

  public static readonly Apple = class {
    public static readonly CLIENT_ID_APP: string = process.env
      .APPLE_CLIENT_ID_APP as string;
    public static readonly CLIENT_ID_WEB: string = process.env
      .APPLE_CLIENT_ID_WEB as string;
  };

  public static readonly MySql = class {
    public static readonly PROJECT: mysql.ConnectionOptions = {
      host: "112.220.89.162",
      port: 33060,
      user: "ktfa",
      password: "kt_Gudfkd11",
      database: "metafashion",
      connectTimeout: 60000,
      multipleStatements: true,
      timezone: "Z",
      connectionLimit: 200
    };
  };
  public static readonly File = class {
    public static readonly FILE_PATH: string = path.resolve("resources", "contents");
    // 콘텐츠 이미지 스토리지 접근 경로
    public static readonly FILE_CONTENTS_PATH: string = path.resolve("resources", "contents");
    // 팝업 이미지 스토리지 접근 경로
    public static readonly FILE_POPUP_PATH: string = path.resolve("resources", "popups");
    // 프로필 이미지 스토리지 접근 경로
    public static readonly FILE_PROFILE_PATH: string = path.resolve("resources", "profile");

    // 콘텐츠 에셋 웹 접근 경로
    public static readonly WEB_CONTENTS_BASE: string = "/resources/contents"
    // 팝업 이미지 웹 접근 경로
    public static readonly WEB_POPUP_BASE: string = "/resources/popups"
    // 프로필 이미지 웹 접근 경로
    public static readonly WEB_PROFILE_BASE: string = "/resources/profile"
  };
}
