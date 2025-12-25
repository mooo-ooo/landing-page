import axios from 'axios';
import type { ExchangeName } from '../types/exchange';
import { PROXY_URL } from "../config";

export const fetchContractSize = async (
  exchange: ExchangeName,
  baseToken: string,
): Promise<number> => {
  const quoteToken = 'USDT'

  try {
    switch (exchange) {
      case 'okx': {
        const { data } = await axios.get(
          `https://www.okx.com/api/v5/public/instruments?instId=${baseToken}-${quoteToken}-SWAP&instType=SWAP`,
        );
        const val = data?.data?.[0]?.ctVal;
        return val ? Number(val) : 0;
      }

      case 'gate': {
        // Gate.io uses underscores for futures symbols (e.g., BTC_USDT)
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.gateio.ws/api/v4/futures/usdt/contracts/${baseToken}_${quoteToken}`,
        );
        return data?.quanto_multiplier ? Number(data.quanto_multiplier) : 0;
      }

      case 'huobi': {
        const { data } = await axios.get(
          `${PROXY_URL}/https://api.hbdm.com/linear-swap-api/v1/swap_contract_info?contract_code=${baseToken}-${quoteToken}`
        );
        const contract = data?.data?.[0];
        return contract?.contract_size ? Number(contract.contract_size) : 0;
      }

      case 'bitget':
      case 'coinex':
      case 'bybit':
        // These exchanges typically use 1 as the default multiplier for linear futures, 
        // but it's safer to return 1 than undefined for calculation purposes.
        return 1;

      default:
        console.warn(`No contract size fetcher defined for exchange: ${exchange}`);
        return 1;
    }
  } catch (error) {
    console.error(`Error fetching contract size for ${exchange} ${baseToken}:`, error);
    // Return a default or re-throw based on your app's needs
    return 0; 
  }
};