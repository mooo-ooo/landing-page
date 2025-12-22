import axios from "axios";
import type { ExchangeName } from "../types/exchange";
import { PROXY_URL } from "../config";


export const getOpenInterest = async (
  exchange: ExchangeName,
  symbol: string
): Promise<number> => {
  try {
    switch (exchange) {
      case "okx": {
        const { data } = await axios.get(
          `https://www.okx.com/api/v5/public/funding-rate?instId=${symbol}-USDT-SWAP`
        );
        if (data.code !== "0") {
          throw new Error(`OKX API error: ${data.code}`);
        }
        if (!data.data[0]) {
          throw new Error("OKX API returned no data");
        }

        return 0
      }
      case "gate": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/contract_stats?contract=${symbol}_USDT`
        );

        return parseFloat(data.open_interest_usd);
      }
      case "bitget": {
        const { data } = await axios.get(
          `https://api.bitget.com/api/v2/mix/market/open-interest?symbol=${symbol}USDT&productType=usdt-futures`
        );
        if (data.code !== "00000") {
          throw new Error(`Bitget API error: ${data.code}`);
        }
        if (!data.data[0]) {
          throw new Error("Bitget API returned no data");
        }

        return data.openInterestList[0].size
      }
      case "huobi": {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.hbdm.com/linear-swap-api/v1/swap_his_open_interest?contract_code=${symbol}-USDT&amount_type=cont&period=1day`,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );
        if (data.status !== "ok") {
          throw new Error("Huobi API returned error status");
        }
        console.log(JSON.stringify(data.data))
        return parseFloat(data.data.tick[0].value)
      }

      case "coinex": {
        const {
          data: { data },
        } = await axios.get(
          `${PROXY_URL}/https://api.coinex.com/v2/futures/ticker?market=${symbol}USDT`
        );
        return parseFloat(data[0].open_interest_volume);
      }
      default: {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to fetch OpenInterest from ${exchange}: ${error.message}`
      );
    }
    throw new Error(
      `Failed to fetch OpenInterest from ${exchange}: Unknown error`
    );
  }
};
