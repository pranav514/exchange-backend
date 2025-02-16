import fs from "fs"; // to store the snapshot
import { RedisManager } from "../RedisManager";
import { OrderBook } from "./orderBook";
import { UserBalance } from "../types/interface";
import { BASE_CURRENCY, CREATE_ORDER } from "../types/constants";
import { MessageFromApi } from "../types/MessagefromApi";
import { throwDeprecation } from "process";

// shot = {
//     orderbooks {

//     },
//     balances {

//     }
// }

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
    fs.writeFileSync("/.snaphshot.json", JSON.stringify(shot));
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    if (message.type === CREATE_ORDER) {
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
      if (
        this.balances.get(userId)?.[quoteAsset]?.available ||
        0 < required_balance
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

  setBaseBalances() {
    this.balances.set("1", {
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
      BASE_CURRENCY: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });
    this.balances.set("5", {
      BASE_CURRENCY: {
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
