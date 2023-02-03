import express from 'express';
import { ErrorCode } from '@src/const/error_code';
import { logger } from '@src/utils/logger';
import { User } from '@src/services/user';
import bcrypt from 'bcrypt';

const route = express.Router();


route.delete('/:accountId',
  async (req: express.Request, res: express.Response) => {
    const accountId: number = Number(req.params.accountId);
    const accountDeleted: boolean = await User.deleteOne(accountId);
    const userDeleted: boolean = await User.deleteOne(accountId);
    if (accountDeleted && userDeleted) {
      return res.status(200).json({
        status: ErrorCode.OK,
        message: 'OK'
      });
    } else {
      logger.error(`update account/user failed: ${accountId}`);
      return res.status(200).json({
        status: ErrorCode.QUERY_EXEC_ERROR,
        message: 'QUERY EXEC ERROR'
      });
    }
});

route.patch('/password',
  async (req: express.Request, res: express.Response) => {
  const accountId: number = req.body.accountId;
  const password: string = req.body.password;
  const passwordMatched = password
    .match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[~!@#$%^&*()]).{8,}$/g);
  if (!passwordMatched) {
    return res.status(200).json({
      status: ErrorCode.INVALID_PASSWORD_ERROR,
      message: 'INVALID PASSWORD FORMAT'
    });
  }
  const hashed: string = bcrypt.hashSync(password, 4);
  const patched: boolean = await User.patchPassword(accountId, hashed);
  if (patched) {
    return res.status(200).json({
      status: ErrorCode.OK,
      message: 'password changed'
    });
  } else {
    return res.status(200).json({
      status: ErrorCode.QUERY_EXEC_ERROR,
      message: 'QUERY EXEC ERROR'
    });
  }
});

route.patch('/nickname',
  async (req: express.Request, res: express.Response) => {
    const accountId: number =  req.body.accountId;
    const nickname: string = req.body.nickname;

    const matchedArray: string[] | null =
      nickname.match(/^[가-힣A-Za-z0-9]{1,20}$/g);
    if (!matchedArray) {
      logger.warn(`invalid nickname: ${nickname}`);
      return res.status(200).json({
        status: ErrorCode.INVALID_NICKNAME,
        message: 'Invalid nickname'
      });
    }
    const duplicated: boolean = await User.isNicknameDuplicated(nickname);
    if (duplicated) {
      logger.warn(`username duplicated: ${nickname}`);
      return res.status(200).json({
        status: ErrorCode.DUPLICATE_NICKNAME,
        message: 'Duplicate nickname'
      });
    }
    const patched: boolean = await User.patchNickname(accountId, nickname);
    if (patched) {
      logger.info(`patched username: ${accountId} to ${nickname}`);
      return res.status(200).json({
        status: ErrorCode.OK,
        message: 'Nickname changed'
      })
    } else {
      logger.error('patch username query failed');
      return res.status(200).json({
        status: ErrorCode.QUERY_EXEC_ERROR,
        message: 'QUERY EXEC ERROR'
      });
    }
});

export default route;