import axios from "axios";
import type { ExchangeName } from "../types/exchange";
import { PROXY_URL } from '../config'

export interface CandleStick {
  price: number;
  time: number;
}

const twoWeeks = 24 * 14;
export const getCandleSticks = async (
  exchange: ExchangeName,
  symbol: string
): Promise<CandleStick[]> => {
  try {
    switch (exchange) {
      case "coinex": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.coinex.com/v2/futures/kline?market=${symbol}USDT&period=1hour&limit=${twoWeeks}`
        );
        return data.data.map(
          ({ close, created_at }: { close: string; created_at: number }) => {
            return {
              price: Number(close),
              time: created_at,
            };
          }
        );
      }
      case "okx": {
        const {
          data: { data: dataFirst },
        } = await axios.get(
          `https://www.okx.com/api/v5/market/history-mark-price-candles?instId=${symbol}-USDT-SWAP&bar=1H&limit=200`
        );

        const {
          data: { data: dataSecond },
        } = await axios.get(
          `https://www.okx.com/api/v5/market/history-mark-price-candles?instId=${symbol}-USDT-SWAP&bar=1H&limit=200&after=${
            dataFirst[dataFirst.length - 1][0]
          }`
        );

        return [...dataFirst, ...dataSecond]
          .slice(0, twoWeeks)
          .map((stick: string[][]) => {
            return {
              price: Number(stick[4]),
              time: Number(stick[0]),
            };
          });
      }
      case "gate": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/candlesticks?contract=${symbol}_USDT&interval=1h&limit=${twoWeeks}`
        );
        return data.map(({ t, c }: { t: number; c: string }) => {
          return {
            price: Number(c),
            time: t * 1000,
          };
        });
      }
      case "bitget": {
        const { data } = await axios.get(
          `https://api.bitget.com/api/v2/mix/market/candles?symbol=${symbol}USDT&granularity=1H&limit=${twoWeeks}&productType=usdt-futures`
        );
        return data.data.map((stick: string[][]) => {
          return {
            price: Number(stick[4]),
            time: Number(stick[0]),
          };
        });
      }
      case "huobi": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.hbdm.com/index/market/history/linear_swap_mark_price_kline?contract_code=${symbol}-USDT&period=60min&size=${twoWeeks}`,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );

        return data.data.map(({ id, close }: { id: number; close: string }) => {
          return {
            price: Number(close),
            time: id * 1000,
          };
        });
      }
      case "bybit": {
        const { data } = await axios.get(
          `https://api.bybit.com/v5/market/kline?category=inverse&symbol=${symbol}USD&interval=60&limit=${twoWeeks}`
        );

        return data.result.list.map((stick: string[][]) => {
          return {
            price: Number(stick[4]),
            time: Number(stick[0]),
          };
        });
      }
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
