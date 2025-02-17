import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, ON_RAMP, SIDE_BUY, SIDE_SELL } from "./constants"

export type MessageToEngine = {
    type : typeof CREATE_ORDER,
    data : {
        market : string,
        price : string,
        quantity : string,
        side : typeof SIDE_BUY | typeof SIDE_SELL
        userId : string
    }
} | {
    type : typeof GET_DEPTH,
    data : {
        market : string
    }
} | {
    type : typeof CANCEL_ORDER,
    data : {
        orderId : string,
        market : string
    }
} | {
    type : typeof GET_OPEN_ORDERS,
    data : {
        userId : string,
        market : string
    }
} | {
    type : typeof ON_RAMP,
    data : {
        amount : string,
        userId : string,
        txnId : string
    }
}