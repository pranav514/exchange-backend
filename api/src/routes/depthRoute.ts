import {Router} from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { RedisManager } from "../config/redisManager";
import { GET_DEPTH } from "../types/constants";
const router =  Router();
router.get('/' , async(req , res) => {
    const {symbol} = req.query;
    const response = await RedisManager.getInstance().sendAndAwait(({
        type : GET_DEPTH,
        data : {
            market : symbol as string
        }
    }))
    res.json(response.payload);
})

export default router