export type SIDE = "buy" | "sell" | "spot";

export interface ISymbol {
  id: string;
  symbol: string;
  precisionPrice: string;
}
