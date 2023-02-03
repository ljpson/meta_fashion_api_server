import express from "express";
import {Contact} from "@src/services/contact";

const route = express.Router();

// 메시지 전송
route.post("", async (req: express.Request, res: express.Response) => {
    const contactRequest: ContactRequest = req.body;
    console.log(contactRequest);
    return await Contact.save(contactRequest)
        .then(_ => Contact.success(res))
        .catch(e => Contact.fail(res, e));
});


export default route;
