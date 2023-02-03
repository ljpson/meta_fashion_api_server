import { logger } from '@src/utils/logger';
import * as path    from "path";
import jwt from "jsonwebtoken";
const fs = require('fs-extra')



export class FileSystem {
    public static async mkDir(path: string | Buffer): Promise<string> {
        try {
            const isExists = fs.existsSync( path );
            if( !isExists ) {
                fs.mkdirSync( path, { recursive: true } );
            }
            return isExists
        } catch (err) {
            logger.error(`failed: ${err}`);
            return "err";
        }
    }
}
