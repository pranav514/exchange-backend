import { BALANCE_ADDED, DEPTH, OPEN_ORDERS, ORDER_CANCELLED, ORDER_PLACED, SIDE_BUY, SIDE_SELL } from "./constants";

export type MessageFromEngine = {
    type: typeof DEPTH,
    payload: {
        market: string,
        bids: [string, string][],
        asks: [string, string][],
    }
} | 
{
    type : typeof ORDER_PLACED,    
    payload : {
        orderId : string,
        executedQuantity : string,
        fills : [
            {
                price : string,
                quantity : string
                tradeId : string
            }
        ]
    }
} | {
    type : typeof ORDER_CANCELLED,
    payload : {
        orderId : string,
        executedQuantity : number,
        reamingQuantity : number
    }
} | {
    type : typeof OPEN_ORDERS,
    payload : {
       orderId : string,
       executedQuantity : number,
       price : string,
       quantity : string,
       side : typeof SIDE_BUY | typeof SIDE_SELL,
       userId : string
    }
} | {
    type : typeof BALANCE_ADDED ,
    payload : {
        balance : string
    }
}


