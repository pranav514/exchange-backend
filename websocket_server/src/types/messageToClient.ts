
export type MessageToClient = {
    type  : "ticker",
    data : {
        c? : string,
        h? : string,
        l? : string,
        v? : string,
        V? : string,
        s? : string,
        id : number,
        e : "ticker"
    }
} | {
    type : "depth",
    data : {
        b? : [string,string][],
        a? : [string , string][],
        id : number,
        e : "depth"
    }
    
} | {
    type : "trade",
    data : {
        e : "trade",
        t : number,
        m : boolean,
        p : string,
        q : string,
        s: string,
    }
}
