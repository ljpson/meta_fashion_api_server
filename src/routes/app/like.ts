import express from "express";
import {Like} from "@src/services/like";

const route = express.Router();

// 카테고리 등록
route.post("", async (req: express.Request, res: express.Response) => {
    const likeRequest: LikeRequest = req.body;
    await Like.getLike(likeRequest)
        .then(likeRequest => {
           if(likeRequest.id == 0) {
               Like.getMaxLikeId()
                   .then(likeId => {
                       likeRequest.id = likeId;

                       return likeSave(likeRequest, res);
                   })
           } else {
               return likeSave(likeRequest, res);
           }
        });
});

// 카테고리 전체 목록 조회
route.get("", async (req: express.Request, res: express.Response) => {
    let queryParams: QueryParams = req.query;

        // @ts-ignore
        return await Like.findAll(queryParams).then(likes => {
                const resList: any = [];

                likes?.forEach((like) => {
                    resList.push({
                        id: like?.id,
                        contentId: like.contentId,
                        userId: like.userId,
                        likeYn: like.likeYn
                    });
                });

                Like.successWithData(res, likes);
            });
    //}
});

// 좋아요 삭제
route.delete("", async (req: express.Request, res: express.Response) => {
        const id: string = req.query['id'] as string;
        console.log("delete id : " + id);
        return await Like.deleteOne(parseInt(id))
            .then(_ => Like.success(res))
            .catch(e => {
                Like.fail(res, e)
            });
    }
);

function likeSave(likeRequest: LikeRequest, res: express.Response) {
    return Like.save(likeRequest)
        .then(_ => {
            Like.getLike(likeRequest)
                .then(likeRequest => {
                    Like.successWithData(res, likeRequest)
                });
        })
        .catch(e => Like.fail(res, e));
}

export default route;
