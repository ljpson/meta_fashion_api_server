import crypto from 'crypto';
import { logger } from '@src/utils/logger';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET as string;

export class Token {
  public static async issueSignInToken(accountId: number): Promise<string> {
    const EXPIRES_IN = '10d';

    const secret = SECRET;
    const payload = {
      expiresIn: EXPIRES_IN,
      issuer: "server.cms",
      subject: "session"
    }
    // JWT(token)를 secret key 기반으로 생성
    return jwt.sign({accountId: accountId}, secret, payload);
  }

  public static async issueSignInTokenByAdmin(admin: AdminDto): Promise<string> {
    const EXPIRES_IN = '10d';

    const secret = SECRET;
    const payload = {
      expiresIn: EXPIRES_IN,
      issuer: "server.cms",
      subject: "session"
    }
    // JWT(token)를 secret key 기반으로 생성
    return jwt.sign({
      account: admin.account,
      authority: admin.authority
    }, secret, payload);
  }

  public static async verifySignInToken
  (accountId: number, token: string): Promise<number> {
    try {
      const decodedID = await this.verify(token);
      if (decodedID === accountId) {
        return 200;
      }
      return 20024;
    } catch (err) {
      logger.error(`verify token failed: ${err}`);
      return 20000;
    }
  }


  public static async verify(accessToken: string): Promise<number> {
    try {
      const decoded : any = await jwt.verify(accessToken, SECRET);
      if (!decoded) {
      }
      const id = decoded.accountId;
      const issuedAt = decoded.iat;
      const expiration = decoded.exp;
      return id;
    }
    catch (err) {
      logger.error(err);
      return 0;
    }
  }

  public static async verifyAdmin(accessToken: string): Promise<AdminDto | null> {
    try {
      const decoded : any = await jwt.verify(accessToken, SECRET);
      if (!decoded) {
      }

      const admin: AdminDto = {
        account: decoded.account,
        authority: decoded.authority
      }

      return admin;
    }
    catch (err) {
      logger.error(err);
      return null;
    }
  }


  public static async deleteTokens(accountId: number, accessToken: string) {
    try {
      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
}