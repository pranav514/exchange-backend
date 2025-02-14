import {Router} from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { RedisManager } from "../config/redisManager";
import { CREATE_ORDER } from "../types/constants";
const router = Router();

router.post('/' , authMiddleware,async (req , res) => {
    const userId = req.userId;
     const {market ,price , quantity , side} = req.body;
        if(!market || !price || !quantity || !side || !userId){
             res.status(400).json({msg: "Please enter all fields"});
        }
        const response = await RedisManager.getInstance().sendAndAwait({
            type  : CREATE_ORDER,
            data: {
                market,
                price,
                quantity,
                side,
                userId
            }
        })
        res.json(response.payload)

})

export default router