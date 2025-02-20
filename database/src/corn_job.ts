import { client } from "./client";

client.connect();

async function refereshViews(){
    await client.query('REFRESH MATERIALIZED VIEW klines_1m')
    await client.query('REFRESH MATERIALIZED VIEW klines_1h')
    await client.query('REFRESH MATERIALIZED VIEW klines_1w');
    console.log('view refereshed succesfully');
}
setInterval(() => {
    refereshViews();
} , 1000*10)