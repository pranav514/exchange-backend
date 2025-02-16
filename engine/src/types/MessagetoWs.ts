export type MessagetoWs  = {

    stream : string,
    data : {
        c? : string, // last price
        h? : string, // high
        l? : string, // low
        v? : string, // base asset volume
        V? : string, // Quote Asset Volume
        s? : string, // symbol
        id : number, 
        e : "ticker" // event type
    }
} | {
    stream : string,
    data  : {
        b : [string , string][], // bids
        a : [string , string][], // asks
        e : "depth"
    }
} | {
    stream : string,
    data : {
        e  : "trade",
        t : number,
        m : boolean,
        p : string //price
        q : string // quantity
        s : string //symbol
    }
}



