interface ContentDto {
  id: number;
  categoryId: number;
  categoryName: string;
  designerId: string;
  designerName: string;
  designerProfile: string;
  designerDescription?: string;
  designerfeeds?: any[];
  brandId: number;
  brandName: string;
  type: string;
  title: string;
  thumbnail: string;
  description: string;
  tags: string;
  likeCount: number;
  userLikeYn: string;
  contentName: string;
  mediaDescription: string;
  conceptDescription: string;
  detailDescription: string;
  avatarGender: string;
  topImages: {id: number, path: string}[],
  conceptImages: {id: number, path: string}[],
  detailImages: {id: number, path: string}[],
  medias: {id: number, path: string}[],
  arContents: {id: number, path: string},
  arThumbnail: {id: number, path: string},
  avatarContents: {id: number, path: string},
  avatarThumbnail: {id: number, path: string},
  watermark: {id: number, path: string},
  showYn: number;
  deleteYn: number;
  createBy: string;
  createDate: string;
  updateBy: string;
  updateDate: string;

  // tb_content_assets 테이블
  contentId: string;
  fileName: string;
  filePath: string;
}