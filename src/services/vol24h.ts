import axios from "axios";
import { PROXY_URL } from "../config";
import type { ExchangeName } from "../types/exchange";

interface Vol24h {
  usdt: number;
}

export const get24hVolume = async (
  exchange: ExchangeName,
  symbol: string
): Promise<Vol24h> => {
  try {
    switch (exchange) {
      case "bybit":
        const bybitRes = await axios.get(`${PROXY_URL}/https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}USDT`);
        return {
          usdt: bybitRes.data?.result?.list[0]?.turnover24h
            ? parseFloat(bybitRes.data.result.list[0].turnover24h)
            : 0
        };
      case "okx":
        const okxRes = await axios.get(`${PROXY_URL}/https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT-SWAP`);
        return {
          usdt: okxRes.data?.data?.[0]?.volCcy24h
            ? parseFloat(okxRes.data.data[0].volCcy24h) * parseFloat(okxRes.data.data[0].last)
            : 0
        };
      case "huobi":
        const huobiRes = await axios.get(`${PROXY_URL}/https://api.hbdm.com/linear-swap-ex/market/detail/merged?contract_code=${symbol}-USDT`);
        return {
          usdt: huobiRes.data?.tick?.trade_turnover
            ? parseFloat(huobiRes.data.tick.trade_turnover)
            : 0
        };
      case "coinex":
        const coinexRes = await axios.get(`${PROXY_URL}/https://api.coinex.com/v2/futures/ticker?market=${symbol}USDT`);
        return {
          usdt: coinexRes.data?.data?.[0]?.value
            ? parseFloat(coinexRes.data.data[0].value)
            : 0
        };
      case "gate":
        const gateRes = await axios.get(`${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/tickers?contract=${symbol}_USDT`);
        return {
          usdt: gateRes.data?.[0]?.volume_24h_quote
            ? parseFloat(gateRes.data[0].volume_24h_quote)
            : 0
        };
      case "bitget":
        const bitgetRes = await axios.get(`${PROXY_URL}/https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES&symbol=${symbol}USDT`);
        return {
          usdt: bitgetRes.data?.data?.[0]?.quoteVolume
            ? parseFloat(bitgetRes.data.data[0].quoteVolume)
            : 0,
        };
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  } catch (error) {
    console.error(`Error fetching 24h volume for ${exchange} ${symbol}:`, error);
    return {
      usdt: 0,
    };
  }
}