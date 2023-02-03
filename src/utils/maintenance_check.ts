import { ServerUnaryCall } from '@grpc/grpc-js';
import { logger } from '@src/utils/logger';
import { ErrorCode } from '@src/const/error_code';

export async function maintenanceCheck(): Promise<Record<string, string>> {
  const maintenance_h = {
    message: "",
    startTime: "",
    endTime: ""
  }
  return maintenance_h
}

export function setMaintenanceResponse
(res: any, call: ServerUnaryCall<any, any>): any {
  const maintenancePacket: MaintenanceDto = {
    message: decodeURIComponent(
      call.metadata.get('maintenanceMessage')[0] as string
    ),
    startTime: call.metadata.get('maintenanceStart')[0] as string,
    endTime: call.metadata.get('maintenanceEnd')[0] as string,
  }
  logger.info(`maintenance packet: ${JSON.stringify(maintenancePacket)}`);
  res.setErrorcode(ErrorCode.SERVER_MAINTENANCE);
  res.setMessage(JSON.stringify(maintenancePacket));
  return res;
}