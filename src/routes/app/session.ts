import express from 'express';
import { logger } from '@src/utils/logger';
import { ErrorCode } from '@src/const/error_code';
import { User } from '@src/services/user';
import bcrypt from 'bcrypt';
import {appleSignIn, googleSignIn, hashPassword, signInSocial, Token} from '@src/utils';
import { TokenPayload } from 'google-auth-library';

const route = express.Router();

route.post('/', async (req: express.Request, res: express.Response) => {
  const request: SignInRequest = req.body;
  const platform: string | undefined = req.header('platform');

  if (!request.email || !request.password) {
    const response: DefaultResponse = {
      status: ErrorCode.INVALID_INPUT,
      message: 'INVALID INPUT'
    };
    logger.warn('invalid input');
    return res.status(200).json(response);
  }

  const user: UserDto | null = await User.findOneByEmail(request.email);
  if (!user) {
    logger.warn(`not found account: ${request.email}`);
    const response: DefaultResponse = {
      status: ErrorCode.INVALID_EMAIL_PASSWORD_ERROR,
      message: 'INVALID EMAIL OR PASSWORD'
    };
    return res.status(200).json(response);
  } else if (!!user.password &&
    bcrypt.compareSync(request.password, user.password)) {
    user.platform = platform ? platform : '';
    user.deviceId = '';
    user.pushToken = request.pushToken ? request.pushToken : null;
    const patched: boolean = await User.patchLoginInfo(user);
    if (!patched) {
      logger.warn(`patch login info failed: ${user.id}`);
    }

    const accessToken: string = await Token.issueSignInToken(user.id);
    if (!!accessToken) {

      const response: SignInResponse = {
        status: ErrorCode.OK,
        message: 'OK',
        policyAllow: user.policyAllow === 1,
        accountId: user.id,
        nickname: user.nickname,
        accessToken: accessToken,
        provider: user.provider
      }
      return res.status(200).json(response);
    } else {
      logger.error('issue token failed');
      const response: DefaultResponse = {
        status: ErrorCode.QUERY_EXEC_ERROR,
        message: 'QUERY EXEC ERROR'
      };
      return res.status(500).json(response);
    }
  } else {
    logger.warn('password not matched');
    const response: DefaultResponse = {
      status: ErrorCode.INVALID_EMAIL_PASSWORD_ERROR,
      message: 'INVALID EMAIL OR PASSWORD'
    };
    return res.status(200).json(response);
  }
});

// 로그인
route.post('/login', async (req: express.Request, res: express.Response) => {
  // provider : google
  // idToken : 구글 로그인 후에 취득한 토큰값
  // deviceId : 유니크 문자열
  const { provider, idToken, deviceId } = req.body.command;

  let platform: string | undefined = req.header('platform');
  if (!platform) platform = '';
  if (!idToken || !provider || !deviceId) {
    logger.warn('invalid input');
    return res.status(200).json({
      status: ErrorCode.INVALID_INPUT,
      message: 'INVALID INPUT'
    });
  }
  logger.info(JSON.stringify(req.body));
  const payload: TokenPayload | any = provider === 'google' ?
    await googleSignIn(idToken) : await appleSignIn(idToken);
  if (!payload) {
    console.log(`social!!!!: ${JSON.stringify(payload)}`)
    return res.status(200).json({
      status: ErrorCode.INVALID_ID_TOKEN,
      message: 'INVALID ID TOKEN'
    });
  }

  logger.info(`social login payload: ${JSON.stringify(payload)}`);
  const userDto: UserDto = {
    id: 0,
    deviceId: deviceId,
    email: payload.email,
    password: null,
    channelId: payload.sub,
    provider: provider,
    platform: platform,
    name: payload.name ? payload.name : name,
    nickname: '',
    policyAllow: 0,
    accessToken: null
  }
  const user: UserDto | null = await signInSocial(userDto);

  const userRes: RegisterDto = {
    deviceId: deviceId,
    email: payload.email,
    password: null,
    channelId: payload.sub,
    provider: provider,
    platform: platform,
    username: payload.name ? payload.name : name,
    nickname: '',
    policyAllow: 0,
    accessToken: null
  }
  if (!user) {
    const accountId: any = await User.register(userRes);

    if (!accountId) {
      logger.warn('register query failed');
    }

    const accessToken: string = await Token.issueSignInToken(accountId);
    return res.status(200).json({
      status: ErrorCode.OK,
      message: 'OK',
      command: {
        accountId: accountId,
        deviceId: deviceId,
        channelId: userRes.channelId,
        nickname: userRes.nickname,
        email: userRes.email,
        accessToken: accessToken,
        provider: userRes.provider
      }
    });
  } else {
    logger.info(`user: ${JSON.stringify(user)}`);
    user.platform = platform;
    user.deviceId = deviceId;

    const patched: boolean = await User.patchLoginInfo(user);
    if (!patched) {
      logger.warn('patch last login query failed');
    }

    const accessToken: string = await Token.issueSignInToken(user.id);
    if (!accessToken) {
      return res.status(500).json({
        errorCode: ErrorCode.QUERY_EXEC_ERROR,
        message: 'QUERY EXEC ERROR'
      })
    } else {
      return res.status(200).json({
        status: ErrorCode.OK,
        message: 'OK',
        command: {
          accountId: user.id,
          deviceId: user.deviceId,
          channelId: userRes.channelId,
          nickname: userRes.nickname,
          email: userRes.email,
          accessToken: accessToken,
          provider: userRes.provider
        }
      });
    }
  }
});

// 세션 추가
route.post('/register', async (req: express.Request, res: express.Response) => {
  const request: SignInRequest = req.body;
  const platform: string | undefined = req.header('platform');

  if (!request.email || !request.password ) {
    const response: DefaultResponse = {
      status: ErrorCode.INVALID_INPUT,
      message: 'INVALID INPUT'
    };
    logger.warn('invalid input');
    return res.status(200).json(response);
  }

  const user: UserDto | null = await User.findOneByEmail(request.email);
  if (user) {
    logger.warn(`register account: ${request.email}`);
    const response: DefaultResponse = {
      status: ErrorCode.INVALID_EMAIL_PASSWORD_ERROR,
      message: 'REGISTER ACCOUNT'
    };
    return res.status(200).json(response);
  }
  const passwordHash = await hashPassword(request.password);
  const tokenDto: TokenDto = { email: request.email}

  const registerDto: RegisterDto = {
    email: request.email,
    password: passwordHash,
    accessToken: null,
    policyAllow: 0
  }

  const accountId: any = await User.register(registerDto);

  if (!accountId) {
    logger.warn('register query failed');
  }

  const accessToken: string = await Token.issueSignInToken(accountId);

  if(accessToken){
      return res.status(200).json({
        errorCode: ErrorCode.OK,
        message: 'OK',
        email: request.email,
        accessToken: accessToken
      });
  }else {
    logger.warn('password not matched');
    const response: DefaultResponse = {
      status: ErrorCode.INVALID_EMAIL_PASSWORD_ERROR,
      message: 'INVALID EMAIL OR PASSWORD'
    };
    return res.status(200).json(response);
  }
});

// 토큰 인증
route.post('/verify', async (req: express.Request, res: express.Response) => {
  const accessToken: string = req.body.accessToken;
  const exists: number = await Token.verify(accessToken);
  if (exists === 0) { // 유효기간 초과
    return res.status(200).json({
      status: ErrorCode.TOKEN_EXPIRED_ERROR,
      message: 'TOKEN_EXPIRED_ERROR'
    });
  }
  // 토큰인증 성공
  return res.status(200).json({
    status: ErrorCode.OK,
    message: 'VALID TOKEN'
  });
});

// 로그아웃
route.delete('/:accountId',
    async (req: express.Request, res: express.Response) => {
      const accountId: number = Number(req.params.accountId);
      const accessToken: string = await User.getToken(accountId);
      if (!!accessToken) {
        const deleted: boolean = await Token.deleteTokens(accountId, accessToken);
        if (deleted) {
          const patched: boolean = await User.patchLogoutInfo(accountId);
          if (!patched) {
            logger.warn(`patch login info failed: ${accountId}`);
          }
          return res.status(200).json({
            status: ErrorCode.OK,
            message: 'Sign out'
          });
        } else {
          return res.status(200).json({
            status: ErrorCode.QUERY_EXEC_ERROR,
            message: 'QUERY EXEC ERROR'
          });
        }
      } else {
        logger.warn(`session not found: ${accountId}`);
        return res.status(200).json({
          status: ErrorCode.OK,
          message: 'OK'
        });
      }
    });


export default route;

