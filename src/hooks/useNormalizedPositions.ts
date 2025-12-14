import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectPositions } from "../redux/positions/positionsSlice";
import { selectBalances } from "../redux/balances/balancesSlice";
import type {
  PostitionsState,
  IPosition,
} from "../redux/positions/positionsSlice";

// --- Type Definitions for Normalized Structure ---

interface NormalizedHedging {
  baseToken: string;
  buys: IPosition[];
  sells: IPosition[];
}

// --- Utility Functions (Extracted Logic) ---

/**
 * Creates an IPosition object for a spot balance entry.
 * @param coin The base token (e.g., 'BTC').
 * @param amount The size/amount of the token.
 * @returns A new IPosition object for the spot balance.
 */
const createSpotPosition = (coin: string, amount: number): IPosition => ({
  exchange: "gate",
  side: "spot",
  size: amount,
  baseToken: coin.toUpperCase(),
  // Use a constant for the current timestamp for consistency
  createdAt: new Date().getTime(), 
  
  // Set non-applicable fields to their default/placeholder values
  liqPrice: Number.NaN,
  avgPrice: Number.NaN,
  markPrice: 0,
  fundingRate: 0,
  liqPriceRatio: Number.NaN,
});

/**
 * Normalizes and groups an array of positions by base token into buys/sells.
 * This is the core logic previously duplicated in both functions.
 * @param positions An array of raw or combined IPosition objects.
 * @returns A map of positions grouped by base token.
 */
const groupPositionsByBaseToken = (
  positions: IPosition[]
): Record<string, { buys: IPosition[]; sells: IPosition[] }> => {
  const posMap: Record<string, { buys: IPosition[]; sells: IPosition[] }> = {};

  for (const pos of positions) {
    // 1. Validation: Skip positions without markPrice unless they are 'spot'
    const isInvalidFuturePosition = !pos.markPrice && pos.side !== "spot";
    if (isInvalidFuturePosition) {
      continue;
    }

    // 2. Initialization
    if (!posMap[pos.baseToken]) {
      posMap[pos.baseToken] = {
        buys: [],
        sells: [],
      };
    }

    // 3. Grouping
    if (pos.side === "sell") {
      posMap[pos.baseToken].sells.push(pos);
    } else if (["buy", "spot"].includes(pos.side)) {
      posMap[pos.baseToken].buys.push(pos);
    }
  }

  return posMap;
};

/**
 * Applies the final filtering logic to the grouped positions.
 * This is the filtering logic previously duplicated in both functions.
 * @param groupedPositions An array of normalized position groups.
 * @param selectedExchanges An optional list of exchanges to filter by.
 * @returns The filtered array of normalized position groups.
 */
const filterNormalizedPositions = (
  groupedPositions: NormalizedHedging[],
  selectedExchanges: string[] = []
): NormalizedHedging[] => {
  return groupedPositions
    .filter(({ buys, sells }) => {
      // Filter 1: Exchange selection check
      if (!selectedExchanges?.length) {
        return true;
      }
      
      const involvedExchanges = [...buys, ...sells].map((ex) => ex.exchange);
      const hasSelectedExchange = involvedExchanges.some((exchange) =>
        selectedExchanges.includes(exchange)
      );
      return hasSelectedExchange;
    })
    .filter(({ buys, sells }) => {
      // Filter 2: Spot-only, non-hedged position check
      // Exclude positions that are only 'spot' (buy side) and have no 'sells'
      const isSpotNotHedge = buys[0]?.side === "spot" && sells.length === 0;
      return !isSpotNotHedge;
    });
};

// --- Exported Hook and Utility Function ---

/**
 * Extracts and normalizes positions from the Redux store, including Gate spot balances.
 */
export const useNormalizedPositions = (selectedExchanges: string[] = []) => {
  const positionsStore = useSelector(selectPositions);
  const balances = useSelector(selectBalances);

  // 1. Memoize and generate Spot Positions
  const spotPositions: IPosition[] = useMemo(() => {
    // Safely access and map Gate spot balances
    return balances?.gate?.spot?.map(({ coin, amount }) =>
          createSpotPosition(coin, amount)
        ) ?? [];
  }, [balances]);

  // 2. Memoize and generate Normalized Positions
  const normalizedPositions = useMemo(() => {
    // A. Flatten all exchange positions and enrich with exchange name
    const allFuturePositions: IPosition[] = Object.keys(positionsStore).flatMap(
      (exName) => {
        const exchangePositions =
          positionsStore[exName as unknown as keyof PostitionsState];
        
        return exchangePositions.map((ex) => ({
          ...ex,
          exchange: exName,
        }));
      }
    );

    const allPositions = [...allFuturePositions, ...spotPositions];

    // B. Group positions by base token
    const groupedMap = groupPositionsByBaseToken(allPositions);

    // C. Convert map to array of NormalizedHedging
    const groupedArray: NormalizedHedging[] = Object.keys(groupedMap).map(
      (baseToken) => ({
        baseToken,
        ...groupedMap[baseToken],
      })
    );

    // D. Apply filtering
    return filterNormalizedPositions(groupedArray, selectedExchanges);
  }, [positionsStore, spotPositions, selectedExchanges]);

  return normalizedPositions;
};

/**
 * Normalizes and filters a set of shared positions (PostitionsState).
 */
export const normalizedSharedPositions = (
  sharedPosition: PostitionsState
) => {
  // 1. Flatten all exchange positions and enrich with exchange name
  const allPositions: IPosition[] = Object.keys(sharedPosition).flatMap(
    (exName) => {
      const exchangePositions =
        sharedPosition[exName as unknown as keyof PostitionsState];
      
      return exchangePositions.map((ex) => ({
        ...ex,
        exchange: exName,
      }));
    }
  );

  // 2. Group positions by base token
  const groupedMap = groupPositionsByBaseToken(allPositions);

  // 3. Convert map to array of NormalizedGroup
  const groupedArray: NormalizedHedging[] = Object.keys(groupedMap).map(
    (baseToken) => ({
      baseToken,
      ...groupedMap[baseToken],
    })
  );

  // 4. Apply filtering
  return groupedArray;
};