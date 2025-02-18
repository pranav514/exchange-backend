export const SUBSCRIBE = "SUBSCRIBE";
export const UNSUBSCRIBE = "UNSUBSCRIBE"

export type IncommingMessage = {
    method : typeof SUBSCRIBE
    params : string[]
} | {
    method : typeof UNSUBSCRIBE,
    params : string[]
}