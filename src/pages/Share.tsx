import { useMemo, useRef, useEffect, useState, type FC } from "react";
import { Box } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery'
import PositionsTable from "../components/PositionsTable";
// import ExchangeMargin, { ExchangeMarginMobile } from "../components/ExchangeMargin";
// import FundingFeesChart from "../components/FundingFeesChart";
// import EquitiesChart from "../components/VolumeChart";
import { useSharedFundingRates } from "../hooks";
import { normalizedSharedPositions } from "../hooks/useNormalizedPositions";
import { type PostitionsState } from "../redux/positions/positionsSlice";
import { selectBalances } from "../redux/balances/balancesSlice";
import api from "../lib/axios";
import { useSelector } from "react-redux";

const Share: FC = () => {
  const isWeb = useMediaQuery('(min-width:600px)')
  const balances = useSelector(selectBalances);

  const dashboardRef = useRef<HTMLDivElement>(null);
  // const exchangeMarginRef = useRef<HTMLDivElement>(null);
  // const [dashboardWidth, setDashboardWidth] = useState<number>(0);
  // const [exchangeMarginHeight, setExchangeMarginHeight] = useState<number>(0);
  const [sharedPosition, setSharedPosition] = useState<PostitionsState>();

  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  
  useEffect(() => {
    api.get(`api/v1/shared/portfolio?username=${'xapy'}`).then(({data}) => {
      setSharedPosition(data);
    });
    
  }, []);

  
  const { fundingRates, loading: loadingFundingRates } = useSharedFundingRates(sharedPosition);
  const positionsWithFunding = useMemo(() => {
    const positions = sharedPosition ? normalizedSharedPositions(exchanges, sharedPosition) : [];
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
  }, [sharedPosition, fundingRates]);

  console.log('positionsWithFunding', positionsWithFunding);

  // const estimatedFundingFee = useMemo(() => {
  //   return positionsWithFunding
  //     .map(({ buys, sells }) => {
  //       return [...buys, ...sells];
  //     })
  //     .flat()
  //     .reduce((tot, cur) => {
  //       return (
  //         tot +
  //         cur.markPrice *
  //           cur.size *
  //           (cur.fundingRate || 0) *
  //           (cur.side === "sell" ? 1 : -1)
  //       );
  //     }, 0);
  // }, [positionsWithFunding]);

  // Measure dashboard width and ExchangeMargin height
  // useEffect(() => {
  //   const updateDimensions = () => {
  //     if (dashboardRef.current) {
  //       setDashboardWidth(dashboardRef.current.offsetWidth);
  //     }
  //   };

  //   updateDimensions();
  //   window.addEventListener("resize", updateDimensions);

  //   return () => window.removeEventListener("resize", updateDimensions);
  // }, []);

  // // Measure ExchangeMargin height after it loads data
  // useEffect(() => {
  //   if (!exchangeMarginRef.current) return;

  //   const resizeObserver = new ResizeObserver((entries) => {
  //     for (const entry of entries) {
  //       if (entry.target === exchangeMarginRef.current) {
  //         setExchangeMarginHeight(entry.contentRect.height);
  //       }
  //     }
  //   });

  //   resizeObserver.observe(exchangeMarginRef.current);

  //   return () => resizeObserver.disconnect();
  // }, []);

  // const fixedHeight =
  //   exchangeMarginHeight > 700 || exchangeMarginHeight < 250
  //     ? 300
  //     : exchangeMarginHeight - 24;

  const Mobile = (
    <Box ref={dashboardRef} display="flex" flexDirection="column" gap="12px" py="16px">
      {/* <FundingFeesChart
        width={dashboardWidth}
        height={300}
        estimatedFundingFee={estimatedFundingFee}
      />
      {isWeb ? <ExchangeMargin /> : <ExchangeMarginMobile />} */}
      <PositionsTable
        strategies={[]}
        positions={positionsWithFunding}
        loadingFundingRates={loadingFundingRates}
        exchanges={exchanges}
        error={null}
      />
    </Box>
  );

  if (!isWeb) {
    return Mobile
  }

  return (
    <Box
      ref={dashboardRef}
      display="flex"
      flexDirection="column"
      gap="12px"
      py="16px"
    >
      {/* <Grid container spacing={4}> */}
        {/* <Grid size={3.5}>
          {dashboardWidth && exchangeMarginHeight ? (
            <EquitiesChart height={fixedHeight} />
          ) : null}
        </Grid>
        <Grid size={3.5}>
          {dashboardWidth && exchangeMarginHeight ? (
            <FundingFeesChart
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
      </Grid> */}
      
      <PositionsTable
        strategies={[]}
        positions={positionsWithFunding}
        loadingFundingRates={loadingFundingRates}
        exchanges={exchanges}
        error={null}
      />
    </Box>
  );
};

export default Share;
