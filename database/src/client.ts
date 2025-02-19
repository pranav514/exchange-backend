import {Client} from "pg";
export const pgClient = new Client({
    user : 'your_user',
    host : 'localhost',
    database : 'my_database',
    password : 'your_password',
    port : 5432,
})

export const client = new Client({
    user : 'your_user',
    host : 'localhost',
    database : 'my_database',
    password : 'your_password',
    port : 5432,
})