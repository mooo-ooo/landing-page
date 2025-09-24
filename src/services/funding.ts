import axios from 'axios';
import type { ExchangeName } from '../types/exchange';
import { PROXY_URL } from '../config'

export interface FundingRate {
  symbol: string;
  rate: number;
  interval: number | null;
}

export interface FundingRateResponse {
  data: FundingRate[];
}

export interface OkxFundingRateResponse {
  code: string;
  data: Array<{
    instId: string;
    fundingRate: string;
    nextFundingTime: string;
  }>;
}

export interface HuobiFundingRateResponse {
  status: string;
  data: {
    estimated_rate: string | null;
    funding_rate: string;
    contract_code: string;
    symbol: string;
    fee_asset: string;
    funding_time: string;
    next_funding_time: string | null;
    trade_partition: string;
  };
  ts: number;
}

export const getExchangeFundingRate = async (
  exchange: ExchangeName,
  symbol: string,
): Promise<FundingRate> => {
  try {
    switch (exchange) {
      case 'okx': {
        const { data } = await axios.get<OkxFundingRateResponse>(
          `https://www.okx.com/api/v5/public/funding-rate?instId=${symbol}-USDT-SWAP`,
        );
        if (data.code !== '0') {
          throw new Error(`OKX API error: ${data.code}`);
        }
        if (!data.data[0]) {
          throw new Error('OKX API returned no data');
        }
        return {
          symbol,
          rate: parseFloat(data.data[0].fundingRate),
          interval: 8
        };
      }
      case 'gate': {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/contracts/${symbol}_USDT`,
        );
        return {
          symbol,
          rate: parseFloat(data.funding_rate),
          interval: data.funding_interval / 60 / 60
        };
      }
      case 'bitget': {
        const { data } = await axios.get(
          `https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=${symbol}USDT&productType=usdt-futures`,
        );
        if (data.code !== '00000') {
          throw new Error(`Bitget API error: ${data.code}`);
        }
        if (!data.data[0]) {
          throw new Error('Bitget API returned no data');
        }
        return {
          symbol,
          rate: parseFloat(data.data[0].fundingRate),
          interval: Number(data.data[0].fundingRateInterval)
        };
      }
      case 'huobi': {
        const { data } = await axios.get<HuobiFundingRateResponse>(
          `${PROXY_URL}/https://api.hbdm.com/linear-swap-api/v1/swap_funding_rate?contract_code=${symbol}-USDT`,
          {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          },
        );
        if (data.status !== 'ok') {
          throw new Error('Huobi API returned error status');
        }

        return {
          symbol,
          rate: parseFloat(data.data.funding_rate),
          interval: null
        };
      }
      default: {
        throw new Error(`Unsupported exchange: ${exchange}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch funding rate from ${exchange}: ${error.message}`);
    }
    throw new Error(`Failed to fetch funding rate from ${exchange}: Unknown error`);
  }
}; 