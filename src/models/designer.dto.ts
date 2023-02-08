interface DesignerDto {
  id: number;
  name: string;
  description: string;
  profile?: string;
  topYn: string;
  topProfile: string;
  topPosition: number;
  brands: any[];
  brandTop1: string;
  showYn: string;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
  contactAll?: number;
  contactRead?: number;
  followers?: number;
  feedCount?: number;
  feeds?: any[];
  userFollowYn?: string;
}
