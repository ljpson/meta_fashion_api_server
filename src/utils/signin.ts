import {LoginTicket, OAuth2Client, TokenPayload} from 'google-auth-library';
import verifyAppleToken from 'verify-apple-id-token';
import {Config} from '@src/config/config';
import {User} from '@src/services/user';
import {logger} from '@src/utils/logger';

const bcrypt = require("bcrypt");

async function googleSignIn
(idToken: string): Promise<TokenPayload | null | undefined> {
  const CLIENT_ID: string = Config.Env.Google.CLIENT_ID_WEB;
  const IOS_CID: string = Config.Env.Google.CLIENT_ID_IOS;
  const ANDROID_CID: string = Config.Env.Google.CLIENT_ID_ANDROID;
  const AUDIENCE: string[] = [CLIENT_ID, IOS_CID, ANDROID_CID];
  try {
    const client: OAuth2Client = new OAuth2Client(CLIENT_ID);
    const ticket: LoginTicket = await client.verifyIdToken({
      idToken: idToken,
      audience: AUDIENCE
    });
    return ticket.getPayload();
  } catch (err) {
    logger.error(`verify google id token failed: ${err}`);
    return null;
  }
}

async function appleSignIn(idToken: string): Promise<any> {
  const CLIENT_ID_APP: string = Config.Env.Apple.CLIENT_ID_APP;
  const CLIENT_ID_WEB: string = Config.Env.Apple.CLIENT_ID_WEB;
  try {
    return await verifyAppleToken({
      idToken: idToken,
      clientId: [CLIENT_ID_APP, CLIENT_ID_WEB],
    });
  } catch (err) {
    logger.error(`verify apple id token failed: ${err}`);
    return null;
  }
}

async function signInSocial(userDto: UserDto): Promise<UserDto | null> {
  try {
    const channelId: string = userDto.channelId!;
    if (channelId) {
      let user: UserDto | null = await User.findOneByChannelId(channelId);
      if (!user) {

        // await User.save(userDto);

        // const userInserted: boolean = await User.save(userDto);

        // if (!userInserted) {
        //   logger.error('insert user failed');
        //   return null;
        // }

        user = await User.findOneChannel(channelId);
      }
      return user;
    }
    logger.error('id token payload not contains sub');
    return null;
  } catch (err) {
    logger.error(`sign in with social failed: ${err}`);
    return null;
  }
}


async function hashPassword(myPlaintextPassword: string): Promise<any> {
  try {
    return await bcrypt.hash(myPlaintextPassword, 10);
  } catch (err) {
    logger.error(`failed: ${err}`);
    return null;
  }
}

async function hashCompare(myPlaintextPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(myPlaintextPassword, hashedPassword);
  } catch (err) {
    logger.error(`failed: ${err}`);
    return false;
  }
}



export { googleSignIn, appleSignIn, signInSocial, hashPassword, hashCompare };