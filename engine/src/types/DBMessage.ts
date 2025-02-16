import { ORDER_UPDATE, TRADE_ADDED } from "./constants"

export  type DBMessage = {
    type : typeof TRADE_ADDED
    data : {
        id : string,
        isBuyerMaker : boolean,
        price : string,
        quantity : string,
        quoteQuantity : "string",
        timestamp : number,
        market : string
    }
} | {
    type : typeof ORDER_UPDATE,
    data : {
        orderId : string,
        exceutedQty : number,
        market? : string,
        price? : string,
        quantity? : string,
        side? : "buy"|"sell"
    }
}