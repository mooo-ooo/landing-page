import axios from "axios";
import dayjs from 'dayjs'
import type { ExchangeName } from "../types/exchange";

export interface FundingRate {
  fundingTime: Date;
  fundingRate: number;
}

const CORS_PROXY = "http://178.128.110.139:8080";

export const fundingRateHistory = async (
  exchange: ExchangeName,
  symbol: string
): Promise<FundingRate[]> => {
  try {
    switch (exchange) {
      case "coinex": {
        const { data: { data: { records }} } = await axios.get(
          `${CORS_PROXY}/https://api.coinex.com/perpetual/v1/market/funding_history?market=${symbol}USDT&limit=200&offset=0`
        );
        return records.map(
          ({ time, funding_rate }: { funding_rate: string; time: number }) => {
            return {
              fundingRate: Number(funding_rate) * 100,
              fundingTime: dayjs(Number(time) * 1000).startOf('hour').toDate(),
            };
          }
        );
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
          `${CORS_PROXY}/https://api.gateio.ws/api/v4/futures/usdt/funding_rate?contract=${symbol}_USDT&limit=300`
        );
        return data.map(({ t, r }: { t: number; r: string }) => {
          return {
            fundingRate: Number(r) * 100,
            fundingTime: dayjs(t * 1000).startOf('hour').toDate(),
          };
        });
      }
      case "bitget": {
        const { data } = await axios.get(
          `https://api.bitget.com/api/v2/mix/market/history-fund-rate?symbol=${symbol}USDT&productType=USDT-FUTURES&pageSize=100`
        );
        return data.data.map(({fundingTime, fundingRate}: {fundingTime: string, fundingRate: string}) => {
          return {
            fundingRate: Number(fundingRate) * 100,
            fundingTime: dayjs(Number(fundingTime)).startOf('hour').toDate(),
          };
        });
      }
      case "huobi": {
        const { data: { data : { data }} } = await axios.get(
          `${CORS_PROXY}/https://api.hbdm.com/linear-swap-api/v1/swap_historical_funding_rate?contract_code=${symbol}-USDT&page_size=200`,
        );

        return data.map(({ funding_rate, funding_time }: { funding_rate: string; funding_time: string }) => {
          return {
            fundingRate: Number(funding_rate) * 100,
            fundingTime: dayjs(Number(funding_time)).startOf('hour').toDate(),
          };
        }).reverse();
      }
      case "bybit": {
        const { data } = await axios.get(
          `https://api.bybit.com/v5/market/funding/history?limit=200&symbol=${symbol}USDT&category=linear`
        );

        return data.result.list.map(({fundingRateTimestamp, fundingRate}: {fundingRateTimestamp: string, fundingRate: string}) => {
          return {
            fundingRate: Number(fundingRate) * 100,
            fundingTime: dayjs(Number(fundingRateTimestamp)).startOf('hour').toDate(),
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
