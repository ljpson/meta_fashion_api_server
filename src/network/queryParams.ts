interface QueryParams {

    id?: number;        //category, content, brand, designer 공통
    categoryId?: number;
    contentId?: number;
    brandId?: number;
    designerId?: number;
    userId?: number;    // user 별도분리
    type?: string;      // 피드구분, 에셋유형, 약관유형, 탑디자인 구분 공통
    keywords?: string;
    page?: number;
    size?: number;
    totalCount?: number;
    sort?: string;
    avatarGender?: string;
    App?: string;
    myPage?: string;
    brandIds?: number[];
    email?: string;     // user email
}