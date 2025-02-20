import {Client} from "pg"
import {Router} from "express"

const pgClient = new Client({
    user : "your_user",
    host : "localhost",
    database : 'my_database',
    password : 'your_password',
    port : 5432,
})
pgClient.connect();
const router = Router();

router.get('/' , async(req , res) : Promise<any> => {
    const {market , interval , startTime , endTime} = req.query;
    let query;
    switch(interval){
        case '1m':
            query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`
            break;
        case '1h':
            query = `SELECT * FROM klines_1h WHERE  bucket >= $1 AND bucket <= $2`
            break;
        case '1w':
            query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
            break;
        default:
            return res.status(400).send('invalid interval');
    }
    try {
        
        // query += " AND currency_code = $3";
        console.log({
            startTime: new Date(Number(startTime) * 1000),
            endTime: new Date(Number(endTime) * 1000)
        });
        const result    = await pgClient.query(query, [new Date(Number(startTime) * 1000), new Date(Number(endTime) * 1000)]);
        
        res.json(result.rows.map(x => ({
            close: x.close,
            end: x.bucket,
            high: x.high,
            low: x.low,
            open: x.open,
            quoteVolume: x.quoteVolume,
            start: x.start,
            trades: x.trades,
            volume: x.volume,
        })));
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})

export default router