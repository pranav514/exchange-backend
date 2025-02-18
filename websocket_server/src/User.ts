import { WebSocket } from "ws";
import { MessageToClient } from "./types/messageToClient";
import { IncommingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/clientToWebsocket";
import { SubscriptionManager } from "./SubscriptionManager";

export class User{
    private id : string;
    private ws : WebSocket;

    constructor(id : string , ws : WebSocket){
        this.id = id;
        this.ws = ws;
        this.addListener();
    }

    private subscriptions : string[] = [];
    public subscribe(subscription : string){
        this.subscriptions.push(subscription);
    }
    public unsubscribe(subscription :string){
        this.subscriptions = this.subscriptions.filter(s => s!== subscription);
    }
    emit(message : MessageToClient){
        this.ws.send(JSON.stringify(message));
    }
    private addListener(){
        this.ws.on("message" , (message  : string) => {
            const ParsedMessage  : IncommingMessage = JSON.parse(message);
            if(ParsedMessage.method === SUBSCRIBE){
                console.log(ParsedMessage)
                ParsedMessage.params.forEach(s => SubscriptionManager.getInstance().subscribe(this.id, s));
            }
            if(ParsedMessage.method === UNSUBSCRIBE){
                ParsedMessage.params.forEach(s => SubscriptionManager.getInstance().unsubscribe(this.id, s) )
            }
        })
    }
}