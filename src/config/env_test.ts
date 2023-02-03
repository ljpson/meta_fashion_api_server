import IORedis from "ioredis";
import mysql from "mysql2/promise";

export class EnvTest {
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
      host: "database-1.cvt9wlebdrbo.ap-northeast-2.rds.amazonaws.com",
      port: 3306,
      user: "ktfa",
      password: "kt_Gudfkd11",
      database: "metafashion",
      connectTimeout: 60000,
      multipleStatements: true,
      timezone: "Z",
      connectionLimit: 200,
    };
  };

  public static readonly File = class {
    public static readonly FILE_PATH: string = "http://43.200.113.141/resources/contents";
  };
}
