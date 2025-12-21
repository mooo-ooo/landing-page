import axios from "axios";
import type { ExchangeName } from "../types/exchange";
import { PROXY_URL } from '../config'

export interface OrderBooks {
  asks: [[number, number]]
  bids: [[number, number]],
  updated: number
}

export const getMarketDepth = async (
  exchange: ExchangeName,
  symbol: string
): Promise<OrderBooks> => {
  try {
    switch (exchange) {
      case "coinex": {
        const { data: { data } } = await axios.get(
          `${PROXY_URL}/https://api.coinex.com/v2/futures/depth?market=${symbol}USDT&limit=5&interval=0`
        );
        return {
          bids: data.depth.bids,
          asks: data.depth.asks,
          updated: data.depth.updated_at
        }
      }
      // case "okx": {
      //   const {
      //     data: { data: dataFirst },
      //   } = await axios.get(
      //     `https://www.okx.com/api/v5/market/history-mark-price-candles?instId=${symbol}-USDT-SWAP&bar=1H&limit=200`
      //   );

      //   const {
      //     data: { data: dataSecond },
      //   } = await axios.get(
      //     `https://www.okx.com/api/v5/market/history-mark-price-candles?instId=${symbol}-USDT-SWAP&bar=1H&limit=200&after=${
      //       dataFirst[dataFirst.length - 1][0]
      //     }`
      //   );

      //   return [...dataFirst, ...dataSecond]
      //     .slice(0, twoWeeks)
      //     .map((stick: string[][]) => {
      //       return {
      //         price: Number(stick[4]),
      //         time: Number(stick[0]),
      //       };
      //     });
      // }
      case "gate": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/order_book?contract=${symbol}_USDT&interval=0`
        );
        return {
          asks: data.asks.map(({p, s}: { p: string, s: string})=> {
            return [Number(p), Number(s)]
          }),
          bids: data.bids.map(({p, s}: { p: string, s: string})=> {
            return [Number(p), Number(s)]
          }),
          updated: data.update * 1000
        }
      }
      case "bitget": {
        const { data } = await axios.get(
          `https://api.bitget.com/api/v2/mix/market/merge-depth?symbol=${symbol}USDT&precision=scale0&limit=5&productType=usdt-futures`
        );
        return {
          asks: data.data.asks,
          bids: data.data.bids,
          updated: data.data.ts
        }
      }
      case "huobi": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.hbdm.com/linear-swap-ex/market/depth?contract_code=${symbol}-USDT&type=step0`,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );
        
        return {
          bids: data.tick.bids,
          asks: data.tick.asks,
          updated: data.tick.ts
        }
      }
      // case "bybit": {
      //   const { data } = await axios.get(
      //     `https://api.bybit.com/v5/market/kline?category=inverse&symbol=${symbol}USD&interval=60&limit=${twoWeeks}`
      //   );

      //   return data.result.list.map((stick: string[][]) => {
      //     return {
      //       price: Number(stick[4]),
      //       time: Number(stick[0]),
      //     };
      //   });
      // }
      default: {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch CandleStick from ${exchange}: ${error.message}`
      );
    }
    throw new Error(
      `Failed to fetch CandleStick from ${exchange}: Unknown error`
    );
  }
};
