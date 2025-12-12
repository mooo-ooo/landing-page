import { useMemo, useRef, useEffect, useState, type FC } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery'
import PositionsTable from "../components/PositionsTable";
import dayjs from "dayjs";
import numeral from "numeral";
import readableNumber from 'human-readable-numbers'
import { useSharedFundingRates } from "../hooks";
import { normalizedSharedPositions } from "../hooks/useNormalizedPositions";
import { type PostitionsState } from "../redux/positions/positionsSlice";
import { selectBalances, type SummaryBalanceState } from "../redux/balances/balancesSlice";
import api from "../lib/axios";
import { useSelector } from "react-redux";

interface IProfile {username: string, equities: SummaryBalanceState, positions: PostitionsState}

const Share: FC = () => {
  const isWeb = useMediaQuery('(min-width:600px)')
  const balances = useSelector(selectBalances);

  const dashboardRef = useRef<HTMLDivElement>(null);
  // const exchangeMarginRef = useRef<HTMLDivElement>(null);
  // const [dashboardWidth, setDashboardWidth] = useState<number>(0);
  // const [exchangeMarginHeight, setExchangeMarginHeight] = useState<number>(0);
  const [sharedPosition, setSharedPosition] = useState<PostitionsState>();
  const [profiles, setProfiles] = useState<IProfile[]>([]);

  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  
  useEffect(() => {
    api.get(`api/v1/shared-profile/portfolio/${'xapy'}`).then(({data}) => {
      setSharedPosition(data.positions as PostitionsState);
    });
    api.get(`api/v1/shared-profile/portfolio`).then(({ data }) => {
      setProfiles(
        Object.keys(data).map((key) => ({
          username: key,
          equities: data[key].equities,
          positions: data[key].positions,
        }))
      );
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
      <Box mb={4 }>
        {profiles?.map((profile, index) => {
          return <ProfileCard key={index} username={profile.username} equities={profile.equities} positions={profile.positions} />
        })}
      </Box>
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

const ProfileCard: FC<IProfile> = ({ username, equities, positions }) => {
  const mockLastUpdate = Date.now().toString();
  const totalEquity = Object.values(equities).reduce((tot, { total }) => {
    return tot + total;
  }, 0);
  const totalVol = Object.values(positions).flat().reduce(
    (tot, { size, markPrice }) => {
      return tot + (size * markPrice);
    },
    0
  );

  return (
    <Card
      elevation={6}
      key={username}
      sx={{
        mb: 2,
        backgroundColor: "#0d1117", // Darker card background
        border: "1px solid #30363d",
        color: "white",
        maxWidth: '300px'
      }}
    >
      <CardContent>
        <Grid container spacing={1}>
          {/* 1. Datetime & Type (Often prominent info) */}
          <Grid size={6}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" fontWeight="bold">
                {dayjs(new Date(Number(mockLastUpdate))).format("DD/MM/YYYY HH:mm")}
              </Typography>
              <Typography variant="body2" textTransform="capitalize">
                {username}
              </Typography>
            </Box>
          </Grid>

          {/* 2. Status (Often needs prominence) */}
          <Grid size={6}>
            <Box display="flex" justifyContent="flex-end" alignItems="center">
              <Box
                sx={{
                  borderRadius: 8,
                  width: "fit-content",
                  padding: "4px 8px",
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  sx={{
                    color: "white",
                  }}
                >
                  whale
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={12}>
            <hr style={{ border: "1px solid #30363d", margin: "8px 0" }} />
          </Grid>

          {/* 3. Amount, Exchange, Chain */}
          <CardItem
            size={5}
            label="Equity"
            valueComponent={
              <Box display="flex" alignItems="center" gap={0.5}>
                <img
                  src={`https://assets.coincap.io/assets/icons/usdt@2x.png`}
                  width={20}
                  height={20}
                  alt="Currency icon"
                />
                <Typography>{numeral(totalEquity).format("0,0")}</Typography>
              </Box>
            }
          />
          <CardItem
            size={5}
            label="Volumes"
            valueComponent={
              <Typography textTransform="capitalize">{readableNumber.toHumanString(totalVol)}</Typography>
            }
          />
          <CardItem
            size={2}
            label="leverage"
            valueComponent={
              <Typography textTransform="capitalize">x{numeral(totalVol/totalEquity).format("0,0.0")}</Typography>
            }
          />

          {/* 4. To Address */}
          <CardItem
            size={6}
            label="Earned Fees (7d)"
            valueComponent={<Box display="flex" alignItems="center" gap={0.5}>
                <img
                  src={`https://assets.coincap.io/assets/icons/usdt@2x.png`}
                  width={20}
                  height={20}
                  alt="Currency icon"
                />
                <Typography>{numeral(2450).format("0,0")}</Typography>
              </Box>}
          />

          {/* 5. TxId */}
          <CardItem
            size={6}
            label="APR last 7d"
            valueComponent={<Typography>47%</Typography>}
          />
        </Grid>
      </CardContent>
    </Card>
  );
};

const CardItem = ({
  label,
  valueComponent,
  size = 4
}: {
  label: string;
  valueComponent: React.ReactNode;
  size?: number
}) => (
  <Grid size={size} sx={{ mb: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{valueComponent}</Box>
  </Grid>
);

export default Share;
