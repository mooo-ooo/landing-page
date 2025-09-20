export type Num = number | undefined
export type Order = Num[]

export declare type Int = number | undefined;
export declare type int = number;
export declare type Str = string | undefined;
export declare type Strings = string[] | undefined;
export declare type Bool = boolean | undefined;
export declare type IndexType = number | string;
export interface OrderBook {
    asks: [Num, Num][];
    bids: [Num, Num][];
    datetime: Str;
    timestamp: Int;
    nonce: Int;
    symbol: Str;
}