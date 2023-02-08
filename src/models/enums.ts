// Yn
export const YN = {
    Y: 'Y',
    N: 'N'
} as const;
type YN = typeof YN[keyof typeof YN];
// Asset 유형
export const Asset = {
    TOP_IMAGE: 'TOP_IMAGE',
    CONCEPT_IMAGE: 'CONCEPT_IMAGE',
    DETAIL_IMAGE: 'DETAIL_IMAGE',
    MEDIA: 'MEDIA',
    AR_CONTENTS: 'AR_CONTENTS',
    AR_THUMBNAIL: 'AR_THUMBNAIL',
    AVATAR_CONTENTS_FEMALE: 'AVATAR_CONTENTS_FEMALE',
    AVATAR_THUMBNAIL_FEMALE: 'AVATAR_THUMBNAIL_FEMALE',
    AVATAR_CONTENTS_MALE: 'AVATAR_CONTENTS_MALE',
    AVATAR_THUMBNAIL_MALE: 'AVATAR_THUMBNAIL_MALE',
    WATERMARK: 'WATERMARK'
} as const;
type Asset = typeof Asset[keyof typeof Asset];
// 탈퇴 구분
export const LeaveType = {
    SELF: 'SELF',
    ADMIN: 'ADMIN'
} as const;
type LeaveType = typeof LeaveType[keyof typeof LeaveType];
// 관리자 상태
export const AdminStatus = {
    READY: "READY",
    ACCEPT: "ACCEPT",
    REJECT: "REJECT",
    BLOCK: "BLOCK"
} as const;
type AdminStatus = typeof AdminStatus[keyof typeof AdminStatus];
// 관리자 권한
export const AdminAuthority = {
    DESIGNER: "DESIGNER",
    OPERATOR: "OPERATOR",
    ADMIN: "ADMIN",
    SUPERADMIN: "SUPERADMIN"
} as const;
type AdminAuthority = typeof AdminAuthority[keyof typeof AdminAuthority];
// 성별
export const Gender = {
    FEMALE: "FEMALE",
    MALE: "MALE"
} as const;
type Gender = typeof Gender[keyof typeof Gender];
