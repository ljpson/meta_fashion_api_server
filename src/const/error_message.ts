import {ErrorCode} from "@src/const/error_code"

let ErrorMessages = []
ErrorMessages[ErrorCode.OK] = ""
enum ErrorMessage {
  OK                              = 200,
  SERVER_MAINTENANCE              = 1000,
  QUERY_EXEC_ERROR                = 20000,
  USER_NOT_FOUND_ERROR            = 20001,
  EMAIL_NOT_FOUND                 = 20002,
  ACCOUNT_NOT_FOUND               = 20003,
  AVATAR_NOT_FOUND                = 20004,
  INVALID_EMAIL_PASSWORD_ERROR    = 20011,
  INVALID_PASSWORD_ERROR          = 20012,
  INVALID_NICKNAME                = 20013,
  TOKEN_EXPIRED_ERROR             = 20021,
  INVALID_TOKEN_ERROR             = 20022,
  MALFORMED_TOKEN_ERROR           = 20023,
  INVALID_ACCOUNT_ID              = 20024,
  INVALID_ID_TOKEN                = 20025,
  INVALID_INPUT                   = 20026,
  DUPLICATE_EMAIL_ERROR           = 20032,
  INCORRECT_CODE_ERROR            = 20033,
  NOT_VERIFIED_EMAIL_ERROR        = 20034,
  INVALID_EMAIL_FORMAT            = 20035,
  DUPLICATE_NICKNAME              = 20041,
  ALREADY_REGISTERED              = 20042,
  EMAIL_SEND_FAIL                 = 20051,
  INVALID_CONTENT_ID              = 20052,
  NOTICE_LOAD_FAIL                = 20053,
  USED_CATEGORY                   = 20054,
}

export { ErrorMessages };