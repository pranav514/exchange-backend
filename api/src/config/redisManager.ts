import { RedisClientType , createClient } from "redis";
import { MessageToEngine } from "../types/messageToEngine";
import { MessageFromEngine } from "../types/messageFromEngine";

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
    public sendAndAwait(message : MessageToEngine){
        return new Promise<MessageFromEngine>((resolve) => {
            const id = this.generateId();
            this.client.subscribe(id , (message) => {
                this.client.unsubscribe(id);
                resolve(JSON.parse(message));
            });

            this.publisher.lPush("messages" , JSON.stringify({
                clientId : id,
                message
            }))
            
        })
    }

    public generateId(){
        return Math.random().toString(36).substring(7);
    }

    


}