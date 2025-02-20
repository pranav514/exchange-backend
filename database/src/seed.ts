import { client } from "./client";

async function intialize() {
    await client.connect();
    await client.query(`
            DROP TABLE IF EXISTS "tata_prices" CASCADE;
        CREATE TABLE "tata_prices"(
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            volume      DOUBLE PRECISION,
            currency_code   VARCHAR (10)
        );
        
        SELECT create_hypertable('tata_prices', 'time', 'price', 2);
        `);

        await client.query(`
           CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
        `)

        await client.query(`
             CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
            `)
            await client.query(`
                 CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
                `)
                await client.query(`
                    CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
                    SELECT
                        time_bucket('1 hour', time) AS bucket,
                        first(price, time) AS open,
                        max(price) AS high,
                        min(price) AS low,
                        last(price, time) AS close,
                        sum(volume) AS volume,
                        currency_code
                    FROM tata_prices
                    GROUP BY bucket, currency_code;
                `);
                await client.query(`
                    DROP TABLE IF EXISTS "order_updates";
        CREATE TABLE "order_updates"(
            order_id        VARCHAR(50) PRIMARY KEY,
            executed_qty    DOUBLE PRECISION NOT NULL,
            market         VARCHAR(20),
            price           DOUBLE PRECISION,
            quantity        DOUBLE PRECISION,
            side            VARCHAR(4) CHECK (side IN ('buy', 'sell')),
            updated_at      TIMESTAMP DEFAULT NOW()
        );
                    `)

                await client.end();
                console.log("database intialized successfully");
        
    
}
intialize();