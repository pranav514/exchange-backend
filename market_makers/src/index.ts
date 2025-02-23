import axios from "axios";

const BASE_URL = "http://localhost:3000";
const TOTAL_BIDS = 15;
const TOTAL_ASK = 15;
const MARKET = "TATA_INR";
const USER_ID = "5";
const token  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQzZDQzNTdjLTI1YjYtNDdhOS1hZjBhLTJhMzQyZmY4ZDEwZSIsImlhdCI6MTczOTc3MzYyM30.8YGmNgzDNP0ODtlDAuCzy-vzbl77DTPd1nDdSixKYYU"

async function main() {
    const price = 1000 + Math.random() * 10;
    const openOrders = await axios.get(`${BASE_URL}/api/v1/order/open?&market=${MARKET}` , {
        headers : {
            Authorization : `Bearer ${token} `
        }
    });

    const totalBids = openOrders.data.filter((o: any) => o.side === "buy").length;
    const totalAsks = openOrders.data.filter((o: any) => o.side === "sell").length;

    const cancelledBids = await cancelBidsMoreThan(openOrders.data, price);
    const cancelledAsks = await cancelAsksLessThan(openOrders.data, price);


    let bidsToAdd = TOTAL_BIDS - totalBids - cancelledBids;
    let asksToAdd = TOTAL_ASK - totalAsks - cancelledAsks;

    while(bidsToAdd > 0 || asksToAdd > 0) {
        if (bidsToAdd > 0) {
            await axios.post(`${BASE_URL}/api/v1/order`, {
                market: MARKET,
                price: (price - Math.random() * 1).toFixed(1).toString(),
                quantity: "1",
                side: "buy",
            } , {
                headers : {
                    Authorization :`Bearer ${token}`
                }
            });
            bidsToAdd--;
        }
        if (asksToAdd > 0) {
            await axios.post(`${BASE_URL}/api/v1/order`, {
                market: MARKET,
                price: (price + Math.random() * 1).toFixed(1).toString(),
                quantity: "1",
                side: "sell"
            } , {
                headers  : {
                    Authorization : `Bearer ${token}`
                }
            });
            asksToAdd--;
        }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    main();
}

async function cancelBidsMoreThan(openOrders: any[], price: number) {
    let promises: any[] = [];
    openOrders.map(o => {
        if (o.side === "buy" && (o.price > price || Math.random() < 0.1)) {
            promises.push(axios.delete(`${BASE_URL}/api/v1/order`, {
                data: {
                    orderId: o.orderId,
                    market: MARKET
                }
            }));
        }
    });
    await Promise.all(promises);
    return promises.length;
}

async function cancelAsksLessThan(openOrders: any[], price: number) {
    let promises: any[] = [];
    openOrders.map(o => {
        if (o.side === "sell" && (o.price < price || Math.random() < 0.5)) {
            promises.push(axios.delete(`${BASE_URL}/api/v1/order`, {
                data: {
                    orderId: o.orderId,
                    market: MARKET
                }
            }));
        }
    });

    await Promise.all(promises);
    return promises.length;
}

main();