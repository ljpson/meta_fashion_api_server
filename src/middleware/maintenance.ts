import express from 'express';
import { maintenanceCheck } from '@src/utils/maintenance_check';
import { ErrorCode } from '@src/const/error_code';

export const maintenanceMiddleware = async (
  req: express.Request, res: express.Response, next: express.NextFunction
) => {
  const maintenance: Record<string, string> = await maintenanceCheck();
  if (maintenance.actived === 't') { // and not office's ip address
    return res.status(200).json({
      errorCode: ErrorCode.SERVER_MAINTENANCE,
      maintenance: maintenance
    });
  }
  next();
}