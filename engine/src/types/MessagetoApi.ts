import { Order } from "../types/interface";


export type MessageToApi = {
    type: "DEPTH",
    payload: {
        bids: [string, string][],
        asks: [string, string][],
    }
} | {
    type: "ORDER_PLACED",
    payload: {
        orderId: string,
        executedQty: number,
        fills: {
            price: string,
            qty: number,
            tradeId: number
        }[]
    }
} | {
    type: "ORDER_CANCELLED",
    payload: {
        orderId: string,
        executedQty: number,
        remainingQty: number
    }
} | {
    type: "OPEN_ORDERS",
    payload: Order[]
} | {
    type : "BALANCE_ADDED",
    payload : {
        balance  : string
    }
}