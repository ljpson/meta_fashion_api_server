import winston, { Logger } from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import { Format } from 'logform';

const logDir: string = 'logs';  // logs 디렉토리 하위에 로그 파일 저장
const { combine, timestamp, printf } = winston.format;

// Define log format
const logFormat: Format = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

// lamp log format
const lampLogFormat: Format = printf(info => {
  return `${info.message}`;
});


/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger: Logger = winston.createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    logFormat,
  ),
  transports: [
    // info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: `metafashion_info.log`,
      // filename: `%DATE%.log`,
      maxFiles: 30,  // 30일치 로그 파일 저장
      zippedArchive: true,
      maxSize: '1MB'
    }),
    // error 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error',  // error.log 파일은 /logs/error 하위에 저장
      filename: `%DATE%.error.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
});

// lamp logger
const lampLogger: Logger = winston.createLogger({
  format: combine(
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      lampLogFormat,
  ),
  transports: [
    // info 레벨 로그를 저장할 파일 설정
    new winstonDaily({
      level: 'info',
      datePattern: 'YYYY-MM-DD',
      dirname: `${logDir}/lamp`,
      filename: `lamp-%DATE%.log`,
      // filename: `%DATE%.log`,
      maxFiles: 30,  // 30일치 로그 파일 저장
      zippedArchive: true,
      maxSize: '1MB'
    })
  ],
});

const lampLog = (transactionId: string, operation: string, logType: string) => {
  let date = new Date();
  // UTC 적용
  date.setHours(date.getHours() + 9);

  let lampJson: LampLog = {
    timestamp: date.toISOString()
        .replace('T', ' ')
        .replace('Z', ''),
    service: "PG094002",
    operation: operation,
    transactionId: `p-ktfa-pd1-w01_${transactionId}`,
    logType: logType,
    host: {
      name: "p-ktfa-pd1-w01",
      ip: "221.168.50.74"
    }
  }

  if (!!logType && logType === "IN_RES") {
    lampJson.response = {type: "I", code: "", desc: ""}
  }

  lampLogger.info(JSON.stringify(lampJson));
}

// Production 환경이 아닌 경우(dev 등)
if (process.env.SERVER_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),  // 색깔 넣어서 출력
      // winston.format.simple(),  // `${info.level}: ${info.message} JSON.stringify({ ...rest })` 포맷으로 출력
    )
  }));
}

interface LampLog {
  timestamp: string;
  service: string;
  operation: string;
  transactionId: string;
  logType: string;
  host: { name: string; ip: string;  };
  response?: {type: string; code: string; desc: string;};
}

export { logger, lampLog };