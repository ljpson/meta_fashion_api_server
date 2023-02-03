import express from "express";
import {Brand} from "@src/services/brand";
import {Content} from "@src/services/content";
import {Follower} from "@src/services/follower";

const route = express.Router();


// 브랜드 전체 목록
route.get("", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    let queryParams: QueryParams = req.query;

    queryParams.App = "Y";

    return await Brand.totalCount(queryParams)
        .then(queryParams => Brand.findAllApp(queryParams)
            .then(brands => {
                const resList: any = [];
                brands?.forEach((brand) => {
                    //image가 존재할 경우 urlPrefix 추가
                    if (!!brand?.profile) brand.profile = urlPrefix + brand?.profile;

                    resList.push({
                        id: brand.id,
                        name: brand.name,
                        profile: brand.profile,
                        feedCount: brand?.feedCount,
                        feedUpdateDate: brand?.feedUpdateDate,
                    });
                });

                if (!!queryParams.totalCount) {
                    res.header("X-Total-count", String(queryParams.totalCount));
                }
                if (!!queryParams.size) {
                    res.header("X-Limit", String(queryParams.size));
                }
                Brand.successWithData(res, resList);
        }));
});

// 브랜드 전체 목록 + 피드게시물
route.get("/feeds", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    let queryParams: QueryParams = req.query;

    if (!queryParams.userId) queryParams.userId = 0;
    queryParams.App = "Y";

    const brands = await Brand.totalCount(queryParams)
        .then(queryParams => Brand.findAllApp(queryParams));

    // 브랜드 아이디 추출
    const brandIds: number[] = [];
    brands!.forEach(brand => {
        brandIds.push(brand.id!);
    })
    queryParams.brandIds = brandIds;
    const contents = await Content.findByBrandIds(queryParams);
    //브랜드 리스트
    let resList: any = [];
    brands!.forEach(brand => {
        //image가 존재할 경우 urlPrefix 추가
        if (!!brand?.profile) brand.profile = urlPrefix+ brand?.profile;

        // 브랜드별 콘텐츠 추출
        let feeds: any = [];
        contents?.forEach(content => {
            if (brand.id === content.brandId) {
                if (feeds[String(brand.id)] === undefined) {
                    feeds[String(brand.id)] = []
                }
                if (feeds[String(brand.id)].length < 5){
                    //image가 존재할 경우 urlPrefix 추가
                    if (!!content?.thumbnail) content.thumbnail = urlPrefix + content.thumbnail;
                    if (!!content?.designerProfile) content.designerProfile = urlPrefix + content.designerProfile;

                    feeds[String(brand.id)].push({
                        id: content.id,
                        type: content.type,
                        userLikeYn: content?.userLikeYn,
                        likeCount: content?.likeCount,
                        thumbnail: content?.thumbnail,
                        title: content?.title,
                        tags: content?.tags,
                        designerId: content?.designerId,
                        designerName: content?.designerName,
                        designerProfile: content?.designerProfile
                    });
                }
            }
        })

        resList.push({
            id: brand.id,
            name: brand.name,
            profile: brand.profile,
            feedCount: brand?.feedCount,
            feedUpdateDate: brand?.feedUpdateDate,
            feeds: feeds[String(brand.id)]
        });
    });

    if (!!queryParams.totalCount) {
        res.header("X-Total-count", String(queryParams.totalCount));
    }
    if (!!queryParams.size) {
        res.header("X-Limit", String(queryParams.size));
    }

    Brand.successWithData(res, resList);
});


// 브랜드 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    let queryParams: QueryParams = req.query;

    queryParams.brandId = Number(req.params.id);
    if (!queryParams.userId)  queryParams.userId = 0;
    queryParams.App = "Y";

    return await Brand.findByIdApp(queryParams)
        .then(brand => {
            Brand.findDesignerById(queryParams)
                .then(designerList => {
                    Content.findAll(queryParams)
                        .then(contentList => {

                            //디자이너 리스트 생성
                            const designers: any = [];
                            designerList?.forEach((designer) => {
                                //image가 존재할 경우 urlPrefix 추가
                                if (!!designer?.profile) designer.profile = urlPrefix+ designer?.profile;

                                designers.push({
                                    id: designer.id,
                                    name: designer.name,
                                    profile: designer.profile,
                                });
                            });

                            //피드 게시물 리스트 생성
                            const feeds: any = [];
                            contentList?.forEach((content) => {
                                //image가 존재할 경우 urlPrefix 추가
                                if (!!content?.thumbnail) content.thumbnail = urlPrefix + content.thumbnail;
                                if (!!content?.designerProfile) content.designerProfile = urlPrefix + content.designerProfile;

                                feeds.push({
                                    id: content.id,
                                    type: content.type,
                                    userLikeYn: content?.userLikeYn,
                                    likeCount: content?.likeCount,
                                    thumbnail: content?.thumbnail,
                                    title: content?.title,
                                    tags: content?.tags,
                                    designerId: content?.designerId,
                                    designerName: content?.designerName,
                                    designerProfile: content?.designerProfile
                                });
                            });

                            // 브랜드 단건 상세정보 조합
                            //image가 존재할 경우 urlPrefix 추가
                            if (!!brand?.profile) brand.profile = urlPrefix+ brand?.profile;

                            let result = {
                                id: brand?.id,
                                profile: brand?.profile,
                                name: brand?.name,
                                followers: brand?.followers,
                                feedCount: brand?.feedCount,
                                designerCount: brand?.designerCount,
                                about: brand?.description,
                                userFollowYn: brand?.userFollowYn,
                                designers: designers,
                                feeds: feeds
                            };
                            Brand.successWithData(res, result)
                        });
                });
        });
});

// 브랜드 팔로잉/언팔로잉
route.post("/following", async (req: express.Request, res: express.Response) => {
    const followRequest: FollowRequest = req.body;

    await Follower.getFollower(followRequest)
        .then(followRequest => {
            if (followRequest.followId == 0){
                Follower.getMaxFollowerId()
                    .then(followId => {
                        followRequest.followId = followId;
                    });
            }
        });

    return await Follower.changeFollowYn(followRequest)
        .then(_ => {
            Follower.getFollower(followRequest)
                .then(followRequest => {
                    Follower.successWithData(res, followRequest)
                })
        })
        .catch(e => Follower.fail(res, e));
});


export default route;
