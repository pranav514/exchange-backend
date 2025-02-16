import { createClient, RedisClientType } from "redis";
import { DBMessage } from "./types/DBMessage";
import { MessageToApi } from "./types/MessagetoApi";
import { MessagetoWs } from "./types/MessagetoWs";

export class RedisManager{
    private client  : RedisClientType;
    private static instance : RedisManager;
    constructor () {
        this.client = createClient();
        this.client.connect();
    }
    public static getInstance(){
        if(!this.instance){
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    public pushMessage(message : DBMessage){
        this.client.lPush("db_processor" , JSON.stringify(message))
    }
    public sendToApi(cliendId : string , message : MessageToApi){
        this.client.publish(cliendId , JSON.stringify(message));

    }
    public sendToWs(channel : string , message : MessagetoWs){
        this.client.publish(channel , JSON.stringify(message));
    }
}

