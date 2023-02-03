interface UserDto {
  id: number;
  name?: string;
  email: string;
  password: string | null;
  nickname: string;
  gender?: string;
  profile?: string;
  status?: string;
  deviceId?: string;
  provider?: string;
  platform?: string;
  channelId?: string;
  pushAllow?: number;
  pushToken?: string | null;
  policyAllow?: number;
  accessToken?: string | null;
  createDate?: string;
  lastLogin?: string;
  leaveType?: string;
  leaveDate?: string;
  leaveBy?: string;
  leaveByName?: string;
}

interface RegisterDto {
  email: string;
  password?: string | null;
  deviceId?: string;
  accessToken: string | null;
  channelId?: string;
  provider?: string;
  platform?: string;
  username?: string | null;
  nickname?: string;
  policyAllow: number;
}