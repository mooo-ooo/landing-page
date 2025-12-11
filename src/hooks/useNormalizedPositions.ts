import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectPositions } from "../redux/positions/positionsSlice";
import { selectBalances } from "../redux/balances/balancesSlice";
import type {
  PostitionsState,
  IPosition,
} from "../redux/positions/positionsSlice";

export const useNormalizedPositions = (selectedExchanges: string[] = []) => {
  const positionsStore = useSelector(selectPositions);
  const balances = useSelector(selectBalances);

  const spotPositions: IPosition[] = useMemo(() => {
    return balances?.gate
      ? balances?.gate?.spot.map(({ coin, amount }) => ({
          exchange: "gate",
          side: "spot",
          size: amount,
          baseToken: coin.toUpperCase(),
          liqPrice: Number.NaN,
          avgPrice: Number.NaN,
          markPrice: 0,
          fundingRate: 0,
          liqPriceRatio: Number.NaN,
          createdAt: new Date().getTime(),
        }))
      : [];
  }, [balances]);

  const normalizedPositions = useMemo(() => {
    const posMap: Record<string, { buys: IPosition[]; sells: IPosition[] }> =
      {};
    const positions = Object.keys(positionsStore).reduce(
      (acu: IPosition[], exName) => {
        const exchangePositions =
          positionsStore[exName as unknown as keyof PostitionsState];
        if (exchangePositions.length) {
          const result = [
            ...acu,
            ...exchangePositions.map((ex) => ({
              ...ex,
              exchange: exName,
            })),
          ];
          return result;
        }
        return acu;
      },
      []
    );
    positions.concat(spotPositions).forEach((pos) => {
      const inValidPositions: string[] = [];
      if (!pos.markPrice && pos.side !== "spot") {
        inValidPositions.push(pos.baseToken);
      }
      if (inValidPositions.includes(pos.baseToken)) {
        return;
      }
      if (!posMap[pos.baseToken]) {
        posMap[pos.baseToken] = {
          buys: [],
          sells: [],
        };
      }
      if (pos.side === "sell") {
        posMap[pos.baseToken].sells.push(pos);
      }
      if (["buy", "spot"].includes(pos.side)) {
        posMap[pos.baseToken].buys.push(pos);
      }
    });

    return Object.keys(posMap)
      .map((baseToken) => {
        return {
          baseToken,
          ...posMap[baseToken],
        };
      })
      .filter(({ buys, sells }) => {
        if (!selectedExchanges?.length) {
          return true;
        }
        const intersection = [...buys, ...sells]
          .map((ex) => ex.exchange)
          .filter((element) => selectedExchanges.includes(element));
        return intersection.length > 0;
      })
      .filter(({ buys, sells }) => {
        const isSpotNotHedge = buys[0]?.side === "spot" && sells.length === 0;
        return !isSpotNotHedge;
      })
      .map((pos) => {
        return {
          ...pos,
          ...posMap[pos.baseToken],
        };
      });
  }, [positionsStore, balances, selectedExchanges]);

  return normalizedPositions;
};

export const normalizedSharedPositions = (
  selectedExchanges: string[] = [],
  sharedPosition: PostitionsState
) => {
  const posMap: Record<string, { buys: IPosition[]; sells: IPosition[] }> = {};
  const positions = Object.keys(sharedPosition).reduce(
    (acu: IPosition[], exName) => {
      const exchangePositions =
        sharedPosition[exName as unknown as keyof PostitionsState];
      if (exchangePositions.length) {
        const result = [
          ...acu,
          ...exchangePositions.map((ex) => ({
            ...ex,
            exchange: exName,
          })),
        ];
        return result;
      }
      return acu;
    },
    []
  );
  positions.forEach((pos) => {
    const inValidPositions: string[] = [];
    if (!pos.markPrice && pos.side !== "spot") {
      inValidPositions.push(pos.baseToken);
    }
    if (inValidPositions.includes(pos.baseToken)) {
      return;
    }
    if (!posMap[pos.baseToken]) {
      posMap[pos.baseToken] = {
        buys: [],
        sells: [],
      };
    }
    if (pos.side === "sell") {
      posMap[pos.baseToken].sells.push(pos);
    }
    if (["buy", "spot"].includes(pos.side)) {
      posMap[pos.baseToken].buys.push(pos);
    }
  });

  return Object.keys(posMap)
    .map((baseToken) => {
      return {
        baseToken,
        ...posMap[baseToken],
      };
    })
    .filter(({ buys, sells }) => {
      if (!selectedExchanges?.length) {
        return true;
      }
      const intersection = [...buys, ...sells]
        .map((ex) => ex.exchange)
        .filter((element) => selectedExchanges.includes(element));
      return intersection.length > 0;
    })
    .filter(({ buys, sells }) => {
      const isSpotNotHedge = buys[0]?.side === "spot" && sells.length === 0;
      return !isSpotNotHedge;
    })
    .map((pos) => {
      return {
        ...pos,
        ...posMap[pos.baseToken],
      };
    });
};
