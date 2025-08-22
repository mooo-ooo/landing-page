import { useMemo, useRef, useEffect, useState, type FC } from "react";
import { Grid, Box } from "@mui/material";
import PositionsTable from "../components/PositionsTable";
import ExchangeMargin from "../components/ExchangeMargin";
import FundingFeesChart from "../components/FundingFeesChart";
import EquitiesChart from "../components/EquitiesChart";
import { useNormalizedPositions, useFundingRates } from "../hooks";
import { selectPositionsError } from "../redux/positions/positionsSlice";
import { selectBalances } from "../redux/balances/balancesSlice";
import type { IStrategy } from "../redux/strategy/strategySlice";
import { useSelector } from "react-redux";
import type { ISymbol } from "../types";
import api from "../lib/axios";

const Dashboard: FC = () => {
  const [symbols, setSymbols] = useState<ISymbol[]>([]);
  const positionsError = useSelector(selectPositionsError);
  const balances = useSelector(selectBalances);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const exchangeMarginRef = useRef<HTMLDivElement>(null);
  const [dashboardWidth, setDashboardWidth] = useState<number>(0);
  const [exchangeMarginHeight, setExchangeMarginHeight] = useState<number>(0);
  const [strategies, setStrategies] = useState<IStrategy[]>([]);
  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  useEffect(() => {
    api.get("/api/v1/strategies").then(({ data }) => {
      setStrategies(data);
    });
    api
      .get("/api/v1/symbols")
      .then(({ data }: { data: ISymbol[] }) => setSymbols(data));
  }, []);

  const positions = useNormalizedPositions([]);
  const { fundingRates, loading: loadingFundingRates } = useFundingRates();
  const positionsWithFunding = useMemo(() => {
    return positions.map((position) => {
      const updatedBuys = position.buys.map((buy) => ({
        ...buy,
        fundingRate:
          buy.fundingRate === null || buy.fundingRate === undefined
            ? fundingRates[buy.exchange]?.[buy.baseToken]?.rate || 0
            : buy.fundingRate,
      }));

      const updatedSells = position.sells.map((sell) => ({
        ...sell,
        fundingRate:
          sell.fundingRate === null || sell.fundingRate === undefined
            ? fundingRates[sell.exchange]?.[sell.baseToken]?.rate || 0
            : sell.fundingRate,
      }));

      return {
        ...position,
        buys: updatedBuys,
        sells: updatedSells,
      };
    });
  }, [positions, fundingRates]);

  const estimatedFundingFee = useMemo(() => {
    return positionsWithFunding
      .map(({ buys, sells }) => {
        return [...buys, ...sells];
      })
      .flat()
      .reduce((tot, cur) => {
        return (
          tot +
          cur.markPrice *
            cur.size *
            (cur.fundingRate || 0) *
            (cur.side === "sell" ? 1 : -1)
        );
      }, 0);
  }, [positionsWithFunding]);

  // Measure dashboard width and ExchangeMargin height
  useEffect(() => {
    const updateDimensions = () => {
      if (dashboardRef.current) {
        setDashboardWidth(dashboardRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Measure ExchangeMargin height after it loads data
  useEffect(() => {
    if (!exchangeMarginRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === exchangeMarginRef.current) {
          setExchangeMarginHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(exchangeMarginRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const fixedHeight =
    exchangeMarginHeight > 700 || exchangeMarginHeight < 250
      ? 300
      : exchangeMarginHeight - 24;

  return (
    <Box
      ref={dashboardRef}
      display="flex"
      flexDirection="column"
      gap="12px"
      py="16px"
    >
      <Grid container spacing={4}>
        <Grid size={3.5}>
          {dashboardWidth && exchangeMarginHeight ? (
            <EquitiesChart height={fixedHeight} />
          ) : null}
        </Grid>
        <Grid size={3.5}>
          {dashboardWidth && exchangeMarginHeight ? (
            <FundingFeesChart
              loadingFundingRates={loadingFundingRates}
              period={7}
              width={dashboardWidth / (12 / 3.5) || 250}
              height={fixedHeight}
              estimatedFundingFee={estimatedFundingFee}
            />
          ) : null}
        </Grid>
        <Grid size={0.5} />
        <Grid size={4.5}>
          <div ref={exchangeMarginRef}>
            <ExchangeMargin />
          </div>
        </Grid>
      </Grid>
      <PositionsTable
        strategies={strategies}
        symbols={symbols}
        positions={positionsWithFunding}
        loadingFundingRates={loadingFundingRates}
        exchanges={exchanges}
        error={positionsError}
      />
    </Box>
  );
};

export default Dashboard;
