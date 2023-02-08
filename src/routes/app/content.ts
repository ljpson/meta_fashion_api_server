import express from "express";
import {Content} from "@src/services/content";
import {Brand} from "@src/services/brand";
import {Asset} from "@src/services/asset";
import {Category} from "@src/services/category";

const route = express.Router();


// 피드 전체 목록
route.get("", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const queryParams: QueryParams = req.query;
    queryParams.App = "Y";
    if (!queryParams.userId) queryParams.userId = 0;

    return await Content.totalCount(queryParams)
        .then(queryParams => Content.findAll(queryParams)
            .then(contents => {
                const resList: any = [];
                contents?.forEach((content) => {
                    //image가 존재할 경우 urlPrefix 추가
                    if (!!content?.thumbnail) content.thumbnail = urlPrefix + content.thumbnail;
                    if (!!content?.designerProfile) content.designerProfile = urlPrefix + content.designerProfile;

                    resList.push({
                        id: content?.id,
                        type: content.type,
                        avatarFemaleYn: content.avatarFemaleYn,
                        avatarMaleYn: content.avatarMaleYn,
                        userLikeYn: content.userLikeYn,
                        likeCount: content.likeCount,
                        title: content.title,
                        thumbnail: content.thumbnail,
                        description: content.description,
                        tags: content.tags,
                        designerId: content.designerId,
                        designerName: content.designerName,
                        designerProfile: content.designerProfile,
                        categoryId: content.categoryId,
                        categoryName: content.categoryName,
                        contentName: content.contentName,
                        createBy: content.createBy,
                        createDate: content.createDate,
                        updateBy: content.updateBy,
                        updateDate: content.updateDate
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

//피드 타입으로 피팅의상 카테고리 조회
route.get("/categories", async (req: express.Request, res: express.Response) => {
    const queryParams: QueryParams = req.query;

    return await Content.findCategoryByType(queryParams)
        .then(categories => {
            const resList: any = [];

            categories?.forEach((category) => {
                resList.push({
                    id: category?.id,
                    name: category.name,
                    position: category.position,
                    assetCount: category.assetCount
                });
            });

            Category.successWithData(res, resList);
        });
});


// 피드 타입으로 피팅의상 조회
route.get("/assets", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const queryParams: QueryParams = req.query;

    return await Content.findAssetByType(queryParams)
        .then(contents => {
            const resList: any = [];

        contents?.forEach((content) => {
            //image가 존재할 경우 urlPrefix 추가
            if (!!content?.contentsFilePath) content.contentsFilePath = urlPrefix + content.contentsFilePath;
            if (!!content?.thumbnailFilePath) content.thumbnailFilePath = urlPrefix + content.thumbnailFilePath;

            resList.push({
                id: content?.id,
                categoryId: content.categoryId,
                contentId: content.contentId,
                contentName: content.contentName,
                avatarFemaleYn: content.avatarFemaleYn,
                avatarMaleYn: content.avatarMaleYn,
                assetType: content.type,
                contentsFilePath: content.contentsFilePath,
                thumbnailFilePath: content.thumbnailFilePath,
                brandId: content.brandId,
                brandName: content.brandName
            });
        });

        Content.successWithData(res, resList);
    });
});

// 콘텐츠 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    console.log("id 매핑주소 호출")
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const id: number = Number(req.params.id);
    const queryParams: QueryParams = req.query;
    queryParams.contentId = id;

    return await Content.findByIdApp(queryParams)
        .then(content => {
            if (content === null) {
                Content.success(res)
            } else{
                //image가 존재할 경우 urlPrefix 추가
                if (!!content?.thumbnail) content.thumbnail = urlPrefix + content.thumbnail;
                if (!!content?.designerProfile) content.designerProfile = urlPrefix + content.designerProfile;
            }
            queryParams.designerId = Number(content?.designerId);
            queryParams.size = 5;
            queryParams.page = 1;
            Content.findAll(queryParams)
                .then(designerContents => Asset.findAllByContentId(id)
                    .then(assets => {

                        //디자이너 게시물 리스트 생성
                        const designerfeeds: any = [];

                        designerContents?.forEach((feed) => {
                            //image가 존재할 경우 urlPrefix 추가
                            if (!!feed?.thumbnail) feed.thumbnail = urlPrefix + feed.thumbnail;
                            if (!!feed?.designerProfile) feed.designerProfile = urlPrefix + feed.designerProfile;

                            designerfeeds.push({
                                id: feed.id,
                                type: feed.type,
                                userLikeYn: feed?.userLikeYn,
                                likeCount: feed?.likeCount,
                                thumbnail: feed?.thumbnail,
                                title: feed?.title,
                                tags: feed?.tags,
                                designerId: feed?.designerId,
                                designerName: feed?.designerName,
                                designerProfile: feed?.designerProfile
                            });
                        });
                        content!.designerfeeds = designerfeeds

                        //asset 리스트 생성
                        content!.topImages = []
                        content!.conceptImages = []
                        content!.detailImages = []
                        content!.medias = []

                        assets?.forEach((asset) => {

                            const filePath = `${urlPrefix}${asset.filePath}`
                            switch (asset.type) {
                                case 'TOP_IMAGE':
                                    content!.topImages.push({id: asset.id!, path: filePath})
                                    break;
                                case 'CONCEPT_IMAGE':
                                    content!.conceptImages.push({id: asset.id!, path: filePath})
                                    break;
                                case 'DETAIL_IMAGE':
                                    content!.detailImages.push({id: asset.id!, path: filePath})
                                    break;
                                case 'MEDIA':
                                    content!.medias.push({id: asset.id!, path: filePath})
                                    break;
                                case 'AR_CONTENTS':
                                    content!.arContents = {id: asset.id!, path: filePath}
                                    break;
                                case 'AR_THUMBNAIL':
                                    content!.arThumbnail = {id: asset.id!, path: filePath}
                                    break;
                                case 'AVATAR_CONTENTS_FEMALE':
                                    content!.avatarContentsFemale = {id: asset.id!, path: filePath}
                                    break;
                                case 'AVATAR_THUMBNAIL_FEMALE':
                                    content!.avatarThumbnailFemale = {id: asset.id!, path: filePath}
                                    break;
                                case 'AVATAR_CONTENTS_MALE':
                                    content!.avatarContentsMale = {id: asset.id!, path: filePath}
                                    break;
                                case 'AVATAR_THUMBNAIL_MALE':
                                    content!.avatarThumbnailMale = {id: asset.id!, path: filePath}
                                    break;
                                case 'WATERMARK':
                                    content!.watermark = {id: asset.id!, path: filePath}
                                    break;
                            }
                        })
                        Content.successWithData(res, content)
                })
                .catch(e => {
                    Asset.fail(res, e)
                }));
        })
        .catch(e => {
            Content.fail(res, e)
        });
});

export default route;
