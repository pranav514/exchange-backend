import {Router} from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { RedisManager } from "../config/redisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types/constants";
const router = Router();

router.post('/' , authMiddleware,async (req , res) => {
    try{
        const userId = req.userId;
     const {market ,price , quantity , side} = req.body;
        if(!market || !price || !quantity || !side || !userId){
             res.status(400).json({msg: "Please enter all fields"});
        }
        console.log(userId);
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
    }catch(error){
        res.status(411).json({
            error
        })
    }
    

})

router.delete('/:id' , authMiddleware , async(req , res) => {
    try{
        const orderId = req.params.id;
        const market =  req.body.market;
        const response = await RedisManager.getInstance().sendAndAwait({
            type : CANCEL_ORDER,
            data : {
                orderId,
                market,
            }
        })
        res.json(response.payload)
    }catch(error){
        res.json({
            error
        })
    }
})

router.get('/' , authMiddleware,async (req , res) => {
    try{
    const market  = req.body.market;
    const userId = req.userId
    const response  = await RedisManager.getInstance().sendAndAwait({
        type : GET_OPEN_ORDERS,
        data : {
            market,
            userId
        }
    })
    res.json(response.payload)

}catch(error){
        res.json({
            error
        })
    }
})

export default router