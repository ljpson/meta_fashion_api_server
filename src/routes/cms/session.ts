import express from 'express';
import {logger} from '@src/utils/logger';
import {ErrorCode} from '@src/const/error_code';
import {User} from '@src/services/user';
import bcrypt from 'bcrypt';
import {hashCompare, hashPassword, Token} from '@src/utils';
import {Admin} from "@src/services/admin";
import {CustomError} from "@src/errors/CustomError";

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

// 관리자 로그인처리
route.post('/login', async (req: express.Request, res: express.Response) => {
    const {account, password} = req.body.data;

    // 계정, 비밀번호로 관리자 정보 조회
    const admin = await Admin.findByAccount(account);

    try {
        if (!admin) {
            throw new CustomError(ErrorCode.ACCOUNT_NOT_FOUND, "Account is not found");
        }
        const isCorrect = await hashCompare(password, admin?.password!)
        if (!isCorrect) {
            throw new CustomError(ErrorCode.INVALID_PASSWORD_ERROR, "Invalid password");
        }

        const accessToken: string = await Token.issueSignInTokenByAdmin(admin);
        if (!accessToken) {
            throw new CustomError(ErrorCode.QUERY_EXEC_ERROR, "Sign in token issue error");
        } else {
            const result = {
                accountId: admin.id,
                passwordChangeYn: admin.passwordChangeYn,
                accessToken: accessToken
            };

            Admin.successWithData(res, result);
        }

    } catch (e) {
        if (e instanceof CustomError) {
            Admin.fail(res, e);
        }
    }
});


route.post('/register', async (req: express.Request, res: express.Response) => {
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
    if (user) {
        logger.warn(`register account: ${request.email}`);
        const response: DefaultResponse = {
            status: ErrorCode.INVALID_EMAIL_PASSWORD_ERROR,
            message: 'REGISTER ACCOUNT'
        };
        return res.status(200).json(response);
    }
    const passwordHash = await hashPassword(request.password);
    const tokenDto: TokenDto = {email: request.email}

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

    if (accessToken) {
        return res.status(200).json({
            errorCode: ErrorCode.OK,
            message: 'OK',
            email: request.email,
            accessToken: accessToken
        });
    } else {
        logger.warn('password not matched');
        const response: DefaultResponse = {
            status: ErrorCode.INVALID_EMAIL_PASSWORD_ERROR,
            message: 'INVALID EMAIL OR PASSWORD'
        };
        return res.status(200).json(response);
    }
});


route.post('/verify', async (req: express.Request, res: express.Response) => {
    const accessToken: string = req.body.accessToken;
    const exists: number = await Token.verify(accessToken);
    if (exists === 0) {
        return res.status(200).json({
            status: ErrorCode.TOKEN_EXPIRED_ERROR,
            message: 'TOKEN_EXPIRED_ERROR'
        });
    }
    return res.status(200).json({
        status: ErrorCode.OK,
        message: 'VALID TOKEN'
    });
});


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
                    errorCode: ErrorCode.OK,
                    message: 'Sign out'
                });
            } else {
                return res.status(200).json({
                    errorCode: ErrorCode.QUERY_EXEC_ERROR,
                    message: 'QUERY EXEC ERROR'
                });
            }
        } else {
            logger.warn(`session not found: ${accountId}`);
            return res.status(200).json({
                errorCode: ErrorCode.OK,
                message: 'OK'
            });
        }
    });


export default route;

