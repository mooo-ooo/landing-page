/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { PROXY_URL } from "../config";
import type { ExchangeName } from "../types/exchange";

// Define the structure for an exchange's configuration
interface ExchangeConfig {
  url: (symbol: string) => string;
  // A function to extract and calculate the USDT volume from the API response
  extractor: (data: any) => number;
}

// --- Configuration Map for Exchanges ---

// Helper function for safe number parsing from response path
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const exchangeConfigs: Record<string, ExchangeConfig> = {
  bybit: {
    url: (symbol) => `${PROXY_URL}/https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}USDT`,
    extractor: (data) =>
      safeParseFloat(data?.result?.list?.[0]?.turnover24h),
  },
  okx: {
    url: (symbol) => `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT-SWAP`,
    // OKX returns volume in the base currency (volCcy24h), so we multiply by the last price
    extractor: (data) => {
      const item = data?.data?.[0];
      if (!item) return 0;
      const volume = safeParseFloat(item.volCcy24h);
      const price = safeParseFloat(item.last);
      return volume * price;
    },
  },
  huobi: {
    url: (symbol) => `https://api.hbdm.com/linear-swap-ex/market/detail/merged?contract_code=${symbol}-USDT`,
    extractor: (data) =>
      safeParseFloat(data?.tick?.trade_turnover),
  },
  coinex: {
    url: (symbol) => `${PROXY_URL}/https://api.coinex.com/v2/futures/ticker?market=${symbol}USDT`,
    extractor: (data) =>
      safeParseFloat(data?.data?.[0]?.value),
  },
  gate: {
    url: (symbol) => `${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/tickers?contract=${symbol}_USDT`,
    extractor: (data) =>
      safeParseFloat(data?.[0]?.volume_24h_quote),
  },
  bitget: {
    url: (symbol) => `https://api.bitget.com/api/v2/mix/market/ticker?productType=USDT-FUTURES&symbol=${symbol}USDT`,
    extractor: (data) =>
      safeParseFloat(data?.data?.[0]?.quoteVolume),
  },
};

// --- Refactored Main Function ---

export default async (
  exchange: ExchangeName,
  symbol: string
): Promise<number> => {
  // 1. Check if the exchange is supported
  const config = exchangeConfigs[exchange];
  if (!config) {
    // If the type system is enforced correctly, this shouldn't happen,
    // but it's a good safety net for future maintenance.
    console.error(`Unsupported exchange: ${exchange}`);
    return 0;
  }

  try {
    // 2. Construct URL and fetch data
    const apiUrl = config.url(symbol);
    const response = await axios.get(apiUrl);

    // 3. Extract and calculate volume using the configuration
    const usdtVolume = config.extractor(response.data);

    return usdtVolume
  } catch (error) {
    // 4. Centralized error logging
    console.error(`Error fetching 24h volume for ${exchange} ${symbol}:`, error);
    return 0;
  }
};