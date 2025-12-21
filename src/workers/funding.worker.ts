// funding.worker.ts
import { getExchangeFundingRate } from '../services/funding';
import dayjs from 'dayjs';
import { fundingRateHistory } from '../services/fundingRateHistory';
import get24hVolume from '../services/vol24h'
import { type ExchangeName } from '../types/exchange';

export interface HistoryPoint {
  fundingRate: number;
  fundingTime: Date;
}

export interface ArbitrageOpportunity {
  baseToken: string;
  buyExchange: string;
  buyExchangeRate: number;
  buyVol24h: number;   // New: Individual volume for buy side
  sellExchange: string;
  sellExchangeRate: number;
  sellVol24h: number;  // New: Individual volume for sell side
  cumulativeDiff: number;
  cumulativeAPR: number;
  periodWeeks: number;
  nextFundingTime: {
    sell: number,
    buy: number
  }
}

export interface FundingData {
  exchange: ExchangeName;
  symbol: string;
  currentRate: number;
  nextFundingTime: number
  interval: number | null
  vol24h: number; // Added to individual exchange data
  history: HistoryPoint[];
}

export interface WorkerInput {
  tokens: string[];
  exchanges: ExchangeName[];
  type: string
  weeks?: number
}

export interface WorkerOutput {
  status: 'success' | 'error';
  data: ArbitrageOpportunity[];
  errorMessage?: string;
  executionTime: number;
}

const ctx: Worker = self as unknown as Worker;

ctx.addEventListener('message', async (event: MessageEvent<WorkerInput>) => {
  const startTime = performance.now();
  const { tokens, exchanges, type, weeks } = event.data;
  if (type !== 'PROCESS_MARKET') {
    return
  }
  // console.log('Exchanges', exchanges)
  const taskPromises = tokens.flatMap(token => 
    exchanges.map(async (exchange): Promise<FundingData | null> => {
      try {
        // STEP 1: Discovery - Check if token is listed
        const currentRes = await getExchangeFundingRate(exchange, token);
        
        // STEP 2: Token is listed, now fetch history and volume in parallel
        // We use Promise.allSettled for history/volume so that if volume fails, 
        // we can still show funding data (or vice versa).
        const [historyRes, volumeRes] = await Promise.allSettled([
          fundingRateHistory(exchange, token),
          get24hVolume(exchange, token)
        ]);

        const history = historyRes.status === 'fulfilled' ? historyRes.value : [];
        const vol24h = volumeRes.status === 'fulfilled' ? volumeRes.value : 0;

        if (volumeRes.status === 'rejected') {
          console.warn(`Volume fetch failed for ${token} on ${exchange}:`, volumeRes.reason);
        }

        return {
          exchange,
          symbol: token,
          currentRate: currentRes.rate,
          nextFundingTime: currentRes.fundingTime,
          interval: currentRes.interval,
          vol24h: vol24h,
          history: history,
        };
      } catch (err: unknown) {
        console.warn('listing check:', err)
        // If STEP 1 (listing check) fails, we stop here
        return null; 
      }
    })
  );

  try {
    // Use allSettled for the outer loop to ensure the worker never crashes
  const results = await Promise.allSettled(taskPromises);
  // Filter out rejected promises and null results
  const validResults: FundingData[] = results
    .filter((res): res is PromiseFulfilledResult<FundingData | null> => res.status === 'fulfilled')
    .map(res => res.value)
    .filter((item): item is FundingData => item !== null);
    const endTime = performance.now();
    const response: WorkerOutput = {
      status: 'success',
      data: calculateBestArbitrage(validResults, weeks),
      executionTime: endTime - startTime
    };
    ctx.postMessage(response);
  } catch (error) {
    const response: WorkerOutput = {
      status: 'error',
      data: [],
      executionTime: performance.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Worker failed'
    };
    ctx.postMessage(response);
  }
});

/**
 * Calculates the best arbitrage opportunity between two exchanges for each token.
 * It sums up the funding rates over a specific period (1 or 2 weeks).
 */
export const calculateBestArbitrage = (
  allData: FundingData[],
  weeks: number = 1
): ArbitrageOpportunity[] => {
  const daysInPeriod = weeks * 7;
  const cutoffDate = dayjs().subtract(weeks, 'week');
  const opportunities: ArbitrageOpportunity[] = [];

  const tokenGroups: Record<string, FundingData[]> = allData.reduce((acc, item) => {
    if (!acc[item.symbol]) acc[item.symbol] = [];
    acc[item.symbol].push(item);
    return acc;
  }, {} as Record<string, FundingData[]>);

  for (const token in tokenGroups) {
    const dataPoints = tokenGroups[token];

    const validExchangeSummaries = dataPoints
      .map((item) => {
        const historyInRange = item.history.filter((h) => dayjs(h.fundingTime).isAfter(cutoffDate));
        if (historyInRange.length === 0) return null;

        const totalFunding = historyInRange.reduce((sum, h) => sum + h.fundingRate, 0);

        return {
          exchange: item.exchange,
          total: totalFunding,
          current: item.currentRate,
          vol24h: item.vol24h, // Current 24h volume fetched in Step 2
          nextFundingTime: item.nextFundingTime,
          interval: item.interval
        };
      })
      .filter((summary): summary is NonNullable<typeof summary> => summary !== null);

    if (validExchangeSummaries.length < 2) continue;
    
    const sorted = [...validExchangeSummaries].sort((a, b) => a.total - b.total);
    const bestToBuy = sorted[0]; 
    const bestToSell = sorted[sorted.length - 1]; 

    const totalDiff = bestToSell.total - bestToBuy.total;

    if (totalDiff > 0) {
      opportunities.push({
        baseToken: token,
        sellExchange: bestToSell.exchange,
        sellExchangeRate: bestToSell.current,
        sellVol24h: bestToSell.vol24h, // Captured here
        buyExchange: bestToBuy.exchange,
        buyExchangeRate: bestToBuy.current,
        buyVol24h: bestToBuy.vol24h,   // Captured here
        cumulativeDiff: totalDiff,
        cumulativeAPR: (totalDiff / daysInPeriod) * 365,
        periodWeeks: weeks,
        nextFundingTime: {
          sell: bestToSell.nextFundingTime,
          buy: bestToBuy.nextFundingTime,
        }
      });
    }
  }

  return opportunities.sort((a, b) => b.cumulativeAPR - a.cumulativeAPR);
};