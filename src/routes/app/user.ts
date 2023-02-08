import express from "express";
import {User} from "@src/services/user";
import {Policy} from "@src/services/policy";
import {Follower} from "@src/services/follower";
import {Brand} from "@src/services/brand";
import {Content} from "@src/services/content";
import { ErrorCode } from "@src/const/error_code";

const route = express.Router();

// 닉네임 중복여부 false면 사용가능, true면 사용불가
route.get("/duplicated", async (req: express.Request, res: express.Response) => {
  const nickname: string = String(req.query.nickname);
  return await User.isNicknameDuplicated(nickname)
      .then(result => {
        User.successWithData(res, result);
      });
});

// 버전 확인
route.get('/version', async (req: express.Request, res: express.Response) => {

    const preset = require("../../../data/version.json");
    const jsonData = JSON.parse(JSON.stringify(preset));
    console.log(jsonData);

    if (jsonData) {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: 'success',
            command: jsonData,
            serverTimestamp: 1635413389335
        });
    } else {
        return res.status(200).json({
            status: ErrorCode.QUERY_EXEC_ERROR,
            message: 'json load failed',
            serverTimestamp: 1635413389335
        })
    }
});

// 사용자 단건 조회
route.get("/:id", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const id: number = Number(req.params.id);

    return await User.findById(id)
        .then(user => {
            let result;
            if(!!user) {
                //image가 존재할 경우 urlPrefix 추가
                if (!!user?.profile) user.profile = urlPrefix + user?.profile;

                result = {
                    id: user?.id,
                    email: user?.email,
                    nickname: user?.nickname,
                    profile: user?.profile,
                    gender: user?.gender
                };
            } else {
                result = "id에 맞는 데이터가 없거나 탈퇴한 회원입니다."
            }

                Policy.successWithData(res, result)
        });
});

// 사용자가 팔로우 한 디자이너 또는 브랜드 조회 - 키워드 이용
route.get("/:id/follows", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    let queryParams: QueryParams = req.query

    queryParams.id = Number(req.params.id);
    queryParams.type = 'USER';

    return await Follower.totalCount(queryParams)
        .then(queryParams => Follower.findAll(queryParams)
            .then(followers => {
                const resList: any = [];
                followers?.forEach((follow) => {
                    //image가 존재할 경우 urlPrefix 추가
                    if (!!follow?.profile) follow.profile = urlPrefix + follow?.profile;

                    resList.push({
                        type: follow.type,
                        brandId: follow?.brandId,
                        designerId: follow?.designerId,
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

// 사용자가 좋아요 한 피드 전체 목록
route.get("/:id/likes", async (req: express.Request, res: express.Response) => {
    const urlPrefix = `${req.protocol}://${req.get('host')}`;
    const queryParams: QueryParams = req.query;
    queryParams.App = "Y";
    queryParams.myPage = "Y";
    queryParams.userId = Number(req.params.id);

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

// 사용자 정보 가져오기
route.get("/info/:tokenId", async (req: express.Request, res: express.Response) => {
    const tokenId: string = String(req.params.tokenId);
    const user : object = JSON.parse(Buffer.from(tokenId.split('.')[1], 'base64').toString());
    return res.status(200).json({
        status: ErrorCode.OK,
        message: "success",
        data: user
    });
});

// 로그인 : 로그인 기록 및 사용자 정보(+토큰) 가져오기
route.post("/login", async (req: express.Request, res: express.Response) => {
    const tokenId: string = String(req.body.tokenId);
    let googleInfo: {
        email: string;
        picture: string;
    };
    try {
        googleInfo = JSON.parse(Buffer.from(tokenId.split('.')[1], 'base64').toString());
    } catch (e) {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: "success",
            data: {
                message : "구글 로그인 정보를 해석할 수 없습니다. 정확한 토큰을 입력하시기 바랍니다.",
                tokenId : tokenId
            }
        });
    }
    const email: string = googleInfo.email;
    const user: UserDto | null = await User.findOneByEmail(email);

    if(user != null) {
        user.profile = googleInfo.picture;
        User.updateLastLogin(user);
        user.accessToken = tokenId;
        return res.status(200).json({
            status: ErrorCode.OK,
            message: "success",
            data: user
        });
    } else {
        return res.status(200).json({
            status: ErrorCode.OK,
            message: "success",
            data: {
                message : "프로필 입력(회원가입) 페이지로 이동 (URL 추가 필요)",
                email : googleInfo.email,
                profile : googleInfo.picture
            }
        });
    }
});

// 구글 SignUp
route.post("/signup", async (req: express.Request, res: express.Response) => {
    const email: string = String(req.body.email);

    let userRequest: UserRequest = req.body;
    let user: UserDto | null = await User.findOneByEmail(email);

    if(user != null) {
        return User.successWithData(res, "이미 등록된 회원입니다.");
    } else {
        await User.saveGoogleUser(userRequest);
        user = await User.findOneByEmail(email);
        return res.status(200).json({
            status: ErrorCode.OK,
            message: "success",
            data: user
        })
    }
});

// 프로필 업데이트
route.post("/:id/save", async (req: express.Request, res: express.Response) => {
    const gender: string = String(req.body.gender);
    const id: number = Number(req.params.id);

    let userRequest: UserRequest = req.body;
    let user: UserDto | null = await User.findById(id);

    if(gender != 'FEMALE' && gender != 'MALE') {
        return User.successWithData(res, "성별은 FEMALE과 MALE만 입력 가능합니다.");
    } else if (user != null) {
        userRequest.id = user.id;
        const first = new Promise((resolve, reject) => {
            User.saveGoogleUser(userRequest);
            resolve(null);
        });
        const second = new Promise((resolve, reject) => {
            resolve(User.findById(id));
        });
        Promise.all([first, second]).then(result => {
            return res.status(200).json({
                status: ErrorCode.OK,
                message: "success",
                data: result[1]
            })
        });
    } else {
        return User.successWithData(res, "id에 맞는 데이터가 없습니다.");
    }
});

// 사용자 탈퇴처리
route.post("/leave", async (req: express.Request, res: express.Response) => {
    const userRequest: UserRequest = req.body;

    return await User.leaveBySelf(userRequest)
        .then(_ => User.success(res))
        .catch(e => User.fail(res, e));
});

export default route;