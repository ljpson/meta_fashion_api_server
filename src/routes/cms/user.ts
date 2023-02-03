import express from "express";
import {Policy} from "@src/services/policy";
import {Brand} from "@src/services/brand";
import {User} from "@src/services/user";
import {Follower} from "@src/services/follower";
import {Like} from "@src/services/like";
import {adminFilter} from "@src/utils/admin_flter";

const route = express.Router();

// 사용자 등록
route.post("", async (req: express.Request, res: express.Response) => {
    const userRequest: UserRequest = req.body.data;

    return await User.save(userRequest)
        .then(_ => User.success(res))
        .catch(e => User.fail(res, e));
});

// 사용자 수정
route.post("/:id/save", async (req: express.Request, res: express.Response) => {
    const userRequest: UserRequest = req.body.data;
    const id: number = Number(req.params.id);

    userRequest.id = id
    return await User.save(userRequest)
        .then(_ => User.success(res))
        .catch(e => User.fail(res, e));
});

// 사용자 조회
route.get("", async (req: express.Request, res: express.Response) => {
    const queryParams: QueryParams = req.query

    return await User.totalCount(queryParams)
        .then(queryParams => User.findAll(queryParams)
            .then(users => {
                const resList: any = [];

                users?.forEach((user) => {
                    resList.push({
                        id: user?.id,
                        email: user?.email,
                        nickname: user?.nickname,
                        profile: user?.profile,
                        gender: user?.gender,
                        status: user?.status,
                        createDate: user?.createDate,
                        lastLogin: user.lastLogin,
                        leaveType: user.leaveType,
                        leaveDate: user.leaveDate,
                        leaveBy: user.leaveBy,
                        leaveByName: user.leaveByName
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

// 사용자 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const id: number = Number(req.params.id);
    return await User.findById(id)
        .then(user => {

            let result = {
                id: user?.id,
                email: user?.email,
                nickname: user?.nickname,
                profile: user?.profile,
                gender: user?.gender
            };

            Policy.successWithData(res, result)
        });
});

// 사용자 디자이너 조회
route.get("/:id/follow", async (req: express.Request, res: express.Response) => {
    const accessToken: number = req.body.accessToken;
    const command: string = req.body.command;
    let queryParams: QueryParams = req.query

    queryParams.id = Number(req.params.id);
    queryParams.type = 'USER'

    return await Follower.totalCount(queryParams)
        .then(queryParams => Follower.findAll(queryParams)
            .then(followers => {
                const resList: any = [];

                followers?.forEach((follow) => {
                    resList.push({
                        id: follow?.id,
                        name: follow.name,
                        profile: follow.profile,
                        followYn: follow.followYn
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

// 사용자 좋아요 조회
route.get("/:id/like", async (req: express.Request, res: express.Response) => {
    const accessToken: number = req.body.accessToken;
    const command: string = req.body.command;
    let queryParams: QueryParams = req.query

    queryParams.id = Number(req.params.id);

    return await Like.findAllByUserIdTotalCount(queryParams)
        .then(queryParams => Like.findAllByUserId(queryParams)
            .then(likes => {
                const resList: any = [];

                likes?.forEach((like) => {
                    resList.push({
                        id: like?.id,
                        contentId: like.contentId,
                        thumbnail: like.thumbnail,
                        title: like.title
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


// 사용자 탈퇴처리
route.post("/leave", adminFilter, async (req: express.Request, res: express.Response) => {
    const admin: AdminRequest = req.body.admin;
    const userRequest: UserRequest[] = req.body.data;

    // 작성자 설정
    userRequest.forEach(user => {
        user.updateBy = admin.account;
    });
    return await User.leaveByAdmin(userRequest)
        .then(_ => User.success(res))
        .catch(e => User.fail(res, e));
});

export default route;
