import fs from "fs"; // to store the snapshot
import { RedisManager } from "../RedisManager";
import { OrderBook } from "./orderBook";
import { Fill, Order, UserBalance } from "../types/interface";
import {
  BASE_CURRENCY,
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  ON_RAMP,
  ORDER_UPDATE,
  TRADE_ADDED,
} from "../types/constants";
import { MessageFromApi } from "../types/MessagefromApi";
import { error } from "console";

export class Engine {
  private orderBooks: OrderBook[] = [];
  private balances: Map<string, UserBalance> = new Map();
  constructor() {
    let snapshot = null;
    try {
      if (process.env.SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("not snapshot found");
    }
    if (snapshot) {
      const shot = JSON.parse(snapshot.toString());
      this.orderBooks = shot.orderBooks.map(
        (o: OrderBook) =>
          new OrderBook(
            o.baseAsset,
            o.bids,
            o.asks,
            o.lastTradeId,
            o.currentPrice
          )
      );
      this.balances = new Map(shot.balances);
    } else {
      this.orderBooks = [new OrderBook(`TATA`, [], [], 0, 0)];
      this.setBaseBalances();
    }
    setInterval(() => {
      this.savesnapshot();
    }, 3000);
  }
  savesnapshot() {
    const shot = {
      orderbooks: this.orderBooks.map((o) => o.getSnapshot()),
      balances: Array.from(this.balances.entries()),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(shot));
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    console.log("Balances after init:", this.balances);
    switch (message.type) {
      case CREATE_ORDER:
        try {
          const { executedQty, fills, orderId } = this.createOrder(
            message.data.market,
            message.data.price,
            message.data.quantity,
            message.data.side,
            message.data.userId
          );
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              orderId,
              executedQty,
              fills,
            },
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
            },
          });
        }
        break;
        case CANCEL_ORDER:
          try{

            const orderId = message.data.orderId;
            console.log("orderId" , orderId)
            const cancelMarket = message.data.market;
            
            console.log("cancelMarket" , cancelMarket)
            const cancelOrdebook = this.orderBooks.find(o => o.ticker() === cancelMarket);
            const quoteAsset = cancelMarket.split("_")[1];
            console.log("quoteAsset" , quoteAsset)
            if(!cancelOrdebook){
              throw new Error("No orderbook found");
            }
        
            const order  = cancelOrdebook.asks.find(o => o.orderId === orderId) || cancelOrdebook.bids.find(o => o.orderId === orderId);
            if(!order){
              throw new Error("no order found ")
            }
            if(order.side === "buy"){

              const price = cancelOrdebook.cancelBid(order);
              const leftQuantity = (order.quantity - order.filled)*order.price;
              const userBalance = this.balances.get(order.userId)
              if(userBalance?.[BASE_CURRENCY]?.available != undefined){
                  userBalance[BASE_CURRENCY].available += leftQuantity;
                  userBalance[BASE_CURRENCY].locked -= leftQuantity;
              }
              if(price){
                this.sendUpdatedDepthAt(price.toString() , cancelMarket);
              }

            }else{
              const price = cancelOrdebook.cancelAsk(order);
              const leftQuantity = (order.quantity - order.filled);
              const userBalance = this.balances.get(order.userId)

              if(userBalance?.[quoteAsset]?.available != undefined){
                userBalance[quoteAsset].available += leftQuantity;
                userBalance[quoteAsset].locked -= leftQuantity;
            }
            if(price){
              this.sendUpdatedDepthAt(price.toString() , cancelMarket);
            }
            }
            RedisManager.getInstance().sendToApi(clientId ,{
              type : "ORDER_CANCELLED",
              payload : {
                orderId,
                executedQty : 0,
                remainingQty : 0,
              }
            })


          }catch(e){
            console.log(e);
            throw new Error("error ocurred while canceling the order")
          }
          break;
          case GET_OPEN_ORDERS:
            try{
              const openOrder = this.orderBooks.find(o => o.ticker() === message.data.market);
              if(!openOrder){
                throw new Error("no open order found");
              }
              const openOrders = openOrder.getOpenOrders(message.data.userId);
              RedisManager.getInstance().sendToApi(clientId , {
                type : "OPEN_ORDERS",
                payload  : openOrders
              })
            }catch(e){
              console.log(e);
              throw new Error("error occured cannot get open orders");
            }
            break;
            case ON_RAMP:
              console.log(message)
            const userId = message.data.userId;
            console.log("userId" , userId)
            const amount = Number(message.data.amount);
            console.log("amount" , amount);
            const balance = this.onRamp(userId , amount )
            RedisManager.getInstance().sendToApi(clientId , ({
              type : "BALANCE_ADDED",
              payload : {
                balance: JSON.stringify(balance)
              }
            }))
            break;
            case GET_DEPTH:
              try{
                const market = message.data.market;
                const orderbook = this.orderBooks.find(o => o.ticker() === market);
                if(!orderbook){
                  throw new Error("orderbook not found");
                }
                RedisManager.getInstance().sendToApi(clientId , ({
                  type : "DEPTH",
                  payload : orderbook.getDepth()
                }))
              }catch(e){
                console.log(e);
                RedisManager.getInstance().sendToApi(clientId , ({
                  type : "DEPTH",
                  payload: {
                    bids : [],
                    asks : [],
                  }
                }))
              }
        
    }
  }
  createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string
  ) {
    const orderBook = this.orderBooks.find((o) => o.ticker() === market); // find baseAsset_QuoteAsset
    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];
    if (!orderBook) {
      throw new Error("no orderbook found");
    }
    this.lockfunds(
      baseAsset,
      quoteAsset,
      side,
      userId,
      quoteAsset,
      price,
      quantity
    );
    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      filled: 0,
      side,
      userId,
    };
    const { fills, executedQty } = orderBook.addOrder(order);
    this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);
    this.createDbtrades(fills, market, userId);
    this.updateDbOrders(order, executedQty, fills, market);
    this.publisWsDepthUpdates(fills, price, side, market);
    this.publishWsTrades(fills, userId, market);
    return { executedQty, fills, orderId: order.orderId };
  }

  lockfunds(
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    userId: string,
    asset: string,
    price: string,
    quantity: string
  ) {
    if (side == "buy") {
      const required_balance = Number(quantity) * Number(price);
      console.log("required_balance" , required_balance)
      console.log("look userId here" , userId)
      console.log("look here: ",this.balances.get(userId)?.[quoteAsset]?.available);
      if (
        (this.balances.get(userId)?.[quoteAsset]?.available ||
        0 )< required_balance
      ) {
        throw new Error("insufficient balance");
      }
      const userBalance = this.balances.get(userId);
      if (
        userBalance &&
        userBalance[quoteAsset] &&
        userBalance[quoteAsset].available !== undefined
      ) {
        userBalance[quoteAsset].available -= required_balance;
        userBalance[quoteAsset].locked += required_balance;
      }
    } else {
      if (
        (this.balances.get(userId)?.[baseAsset]?.available || 0) <
        Number(quantity)
      ) {
        throw new Error(`insufficient ${baseAsset}`);
      }
      const userBalance = this.balances.get(userId);
      if (
        userBalance &&
        userBalance[baseAsset] &&
        userBalance[baseAsset].available != undefined
      ) {
        userBalance[baseAsset].available =
          userBalance[baseAsset].available - Number(quantity);
        userBalance[baseAsset].locked =
          userBalance[baseAsset].locked + Number(quantity);
      }
    }
  }
  updateBalance(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[],
    executedQty: number
  ) {
    if (side == "buy") {
      fills.forEach((fill) => {
        const userBalance = this.balances.get(fill.otherUserId);
        if (userBalance && userBalance[quoteAsset]?.available !== undefined) {
          userBalance[quoteAsset].available += fill.qty * Number(fill.price);
          userBalance[quoteAsset].locked -= fill.qty * Number(fill.price);
        }
        if (userBalance && userBalance[baseAsset]?.available != undefined) {
          userBalance[baseAsset].locked -= fill.qty;
          userBalance[baseAsset].available += fill.qty;
        }
      });
    } else {
      fills.forEach((fill) => {
        const userBalance = this.balances.get(fill.otherUserId);
        if (userBalance && userBalance[quoteAsset]?.available !== undefined) {
          userBalance[quoteAsset].available += fill.qty * Number(fill.price);
          userBalance[quoteAsset].locked -= fill.qty * Number(fill.price);
        }
        if (userBalance && userBalance[baseAsset]?.available != undefined) {
          userBalance[baseAsset].locked -= fill.qty;
          userBalance[baseAsset].available += fill.qty;
        }
      });
    }
  }

  createDbtrades(fills: Fill[], market: string, userId: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: TRADE_ADDED,
        data: {
          market: market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otherUserId === userId,
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
        },
      });
    });
  }

  publishWsTrades(fills: Fill[], userId: string, market: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().sendToWs(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherUserId === userId,
          p: fill.price,
          q: fill.qty.toString(),
          s: market,
        },
      });
    });
  }
  sendUpdatedDepthAt(price: string, market: string) {
    const orderbook = this.orderBooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    const updatedBids = depth?.bids.filter((x) => x[0] === price);
    const updatedAsks = depth?.asks.filter((x) => x[0] === price);

    RedisManager.getInstance().sendToWs(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"]],
        b: updatedBids.length ? updatedBids : [[price, "0"]],
        e: "depth",
      },
    });
  }

  publisWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string
  ) {
    const orderbook = this.orderBooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    if (side === "buy") {
      const updatedAsks = depth?.asks.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString())
      );
      const updatedBid = depth?.bids.find((x) => x[0] === price);
      console.log("publish ws depth updates");
      RedisManager.getInstance().sendToWs(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks,
          b: updatedBid ? [updatedBid] : [],
          e: "depth",
        },
      });
    }
    if (side === "sell") {
      const updatedBids = depth?.bids.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString())
      );
      const updatedAsk = depth?.asks.find((x) => x[0] === price);
      console.log("publish ws depth updates");
      RedisManager.getInstance().sendToWs(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsk ? [updatedAsk] : [],
          b: updatedBids,
          e: "depth",
        },
      });
    }
  }

  updateDbOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string
  ) {
    RedisManager.getInstance().pushMessage({
      type: ORDER_UPDATE,
      data: {
        orderId: order.orderId,
        exceutedQty: executedQty,
        market: market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: ORDER_UPDATE,
        data: {
          orderId: fill.markerOrderId,
          exceutedQty: fill.qty,
        },
      });
    });
  }
  onRamp(userId: string, amount: number) {
    let user_balance = this.balances.get(userId);
    // console.log(user_balance)

    if (!user_balance) {
        user_balance = {
            [BASE_CURRENCY]: {
                available: amount,
                locked: 0,
            },
            "TATA" : {
              available : 100000,
              locked : 0,
            }
        };

        this.balances.set(userId, user_balance);
        console.log(user_balance);

      
    } else {
  
        user_balance[BASE_CURRENCY].available += amount;
    }
    return user_balance
}

  setBaseBalances() {
    this.balances.set("029b0e5a-d416-44f2-9be8-c0ad35c52598", {
      [BASE_CURRENCY]: {
        available: 100000000,
        locked: 0,
      },
      TATA: {
        available: 100000000,
        locked: 0,
      },
    });
    this.balances.set("2", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });
    this.balances.set("5", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });
  }
}
