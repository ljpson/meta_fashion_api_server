import express from "express";
import {Designer} from "@src/services/designer";
import {Content} from "@src/services/content";
import {Follower} from "@src/services/follower";

const route = express.Router();


// 디자이너 조회
route.get("", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    let queryParams: QueryParams = req.query;

    queryParams.App = "Y";

    return await Designer.totalCount(queryParams)
      .then(queryParams => Designer.findAllApp(queryParams)
          .then(designers => {
            console.log(queryParams);
            const resList: any = [];

            designers?.forEach((designer) => {
                //image가 존재할 경우 urlPrefix 추가
                if (!!designer?.profile) designer.profile = urlPrefix + designer.profile;

                resList.push({
                id: designer.id,
                name: designer.name,
                profile: designer.profile,
                brandTop1: designer.brandTop1,
                });
            });

            if (!!queryParams.totalCount) {
              res.header("X-Total-count", String(queryParams.totalCount));
            }
            if (!!queryParams.size) {
              res.header("X-Limit", String(queryParams.size));
            }
            Designer.successWithData(res, resList);
          }));
});


// 디자이너 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    let queryParams: QueryParams = req.query;

    const id: number = Number(req.params.id);
    queryParams.designerId = id;
    if (!queryParams.userId) queryParams.userId = 0;
    queryParams.App = "Y";

    return await Designer.findByIdApp(queryParams)
        .then(designer => {
            Designer.findBrandById(id)
                .then(brands => {
                    Content.findAll(queryParams)
                        .then(contents => {
                            //디자이너 게시물 리스트 생성
                            const feeds: any = [];
                            contents?.forEach((content) => {
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
                            //디자이너 상세정보 조합
                            //image가 존재할 경우 urlPrefix 추가
                            if (!!designer?.profile) designer.profile = urlPrefix + designer.profile;

                            let result = {
                                id: designer?.id,
                                profile: designer?.profile,
                                name: designer?.name,
                                brandTop1: designer?.brandTop1,
                                followers: designer?.followers,
                                feedCount: designer?.feedCount,
                                about: designer?.description,
                                userFollowYn: designer?.userFollowYn,
                                brands: brands,
                                feeds: feeds
                            };

                            Designer.successWithData(res, result)
                        });
                });
        });
});

// 디자이너 팔로잉/언팔로잉
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
