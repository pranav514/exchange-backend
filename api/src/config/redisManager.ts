import { RedisClientType , createClient } from "redis";

export class RedisManager{
    private client : RedisClientType;
    private publisher : RedisClientType
    private static instance : RedisManager;
    private constructor(){
        this.client = createClient();
        this.client.connect();
        this.publisher = createClient();
        this.publisher.connect();
    }
    public static getInstance(){
        if(!this.instance){
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    


}