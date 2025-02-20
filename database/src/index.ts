import { createClient } from "redis";
import { pgClient } from "./client";
import { MessageFromEngine } from "./types";
pgClient.connect();
async function  main() {


    const redisClient = createClient();
    await redisClient.connect();
    console.log("connected to the redis");

    while(true){
        const resposne = await redisClient.rPop('db_processor' as string);
        if(!resposne){
            // console.log("no message found in the queue");
        }
        else{
            const data : MessageFromEngine = JSON.parse(resposne);
            if(data.type === "TRADE_ADDED"){
                console.log("adding data");
                console.log(data);
                const price = data.data.price;
                const timestamp = new Date(data.data.timestamp);
                const volume  = data.data.quantity
                const query = `INSERT INTO tata_prices (time, price , volume) VALUES ($1 , $2 , $3)`;
                const values = [timestamp,price , volume];
                await pgClient.query(query , values);
            }

        }
    }
    
}

main();