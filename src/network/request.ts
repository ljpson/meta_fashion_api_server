interface SignInRequest {
  email: string;
  password: string;
  deviceId?: string;
  pushToken?: string;
}

interface ContactRequest {
  designerId: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface ContentRequest {
  id: number;
  categoryId: number;
  designerId: number;
  brandId: number;
  type: string;
  title: string;
  description: string;
  tags: string;
  contentName: string;
  mediaDescription: string;
  conceptDescription: string;
  detailDescription: string;
  avatarFemaleYn: string;
  avatarMaleYn: string;
  showYn: string;
  assetIds: string;
  createBy: string;
  updateBy: string;
}

interface CategoryRequest {
  categories: CategoryRequest[];
  id: number;
  name: string;
  position: number;
  deleteYn: string;
  createDate: string;
  updateDate: string;
}

interface BrandRequest {
  id: number;
  name: string;
  profile: string;
  description: string;
  position: number;
  showYn: string;
  deleteYn: string;
  createBy: string;
  updateBy: string;
}

interface DesignerRequest {
  designers: DesignerRequest[];
  id: number;
  name: string;
  description: string;
  profile: string;
  topYn: string;

  topProfile: string;
  topPosition: number;
  brands: string;
  showYn: number;
  deleteYn: string;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
}

interface PolicyRequest {
  type: string;
  contents: string;
  showFrom: string;
  showTo: string;
  createBy: string;
  createDate: string;
}

interface NoticeRequest {
  type: string;
  noticeId: number;
  title: string;
  description: string;
  deleted: number;
  updateDt: string;
}

interface PopupRequest {
  id: number;
  title: string;
  image: string;
  showFrom: string;
  showTo: string;
  showYn: string;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
}

interface AdminRequest {
  id: number;
  account: string;
  name: string;
  part: string;
  password: string;
  authority: string;
  designerId: number;
  status: string;
  passwordChangeYn: string;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
}

interface UserRequest {
  id: number;
  email: string;
  password: string;
  nickname: string;
  gender: string;
  profile: string;
  description: string;
  deviceId: string;
  provider: string;
  platform: string;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;
  leaveBy: string;
}


interface FollowRequest {
  followId: number;
  designerId: number;
  brandId: number;
  followYn: string;
  userId: string;
}

interface LikeRequest {
  id: number;
  contentId: number;
  userId: number;
  likeYn: string;
}