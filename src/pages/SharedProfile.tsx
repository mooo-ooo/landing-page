import { useMemo, useRef, useEffect, useState, type FC } from "react";
import { Box, Card, CardContent, Grid, Typography, Divider } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery'
import PositionsTable from "../components/PositionsTable";
import dayjs from "dayjs";
import numeral from "numeral";
import readableNumber from 'human-readable-numbers'
import { yellow } from "../constants/colors";
import { useSharedFundingRates } from "../hooks";
import { normalizedSharedPositions } from "../hooks/useNormalizedPositions";
import { type PostitionsState } from "../redux/positions/positionsSlice";
import { selectBalances } from "../redux/balances/balancesSlice";
import type { ExchangeName } from "../types/exchange";
import api from "../lib/axios";
import { useSelector } from "react-redux";

interface IEquity {
  equity: number
  available: number
}

interface IProfile {username: string, equities: Record<ExchangeName, IEquity>, positions: PostitionsState}

const Share: FC = () => {
  const isWeb = useMediaQuery('(min-width:600px)')
  const balances = useSelector(selectBalances);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<IProfile | null>(null);
  // const exchangeMarginRef = useRef<HTMLDivElement>(null);
  // const [dashboardWidth, setDashboardWidth] = useState<number>(0);
  // const [exchangeMarginHeight, setExchangeMarginHeight] = useState<number>(0);
  const [profiles, setProfiles] = useState<IProfile[]>([]);

  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  
  useEffect(() => {
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

  
  const { fundingRates, loading: loadingFundingRates } = useSharedFundingRates(selectedProfile?.positions);
  const positionsWithFunding = useMemo(() => {
    const positions = selectedProfile?.positions ? normalizedSharedPositions(exchanges, selectedProfile?.positions) : [];
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
  }, [selectedProfile?.positions, fundingRates]);


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
      <Typography variant="h4" mt={2} component="h1">
        Shared Profiles
      </Typography>
      <Divider><Typography color="textSecondary">
        Explore profiles shared by other users
      </Typography></Divider>
      
      <Box my={1} display="flex" gap={2}>
        {profiles?.map((profile, index) => {
          return (
            <Box
              key={index}
              onClick={() => {
                setSelectedProfile(profile);
              }}
              padding={0}
              sx={{
                cursor: "pointer",
                borderRadius: 2,
                borderBottom:
                  selectedProfile?.username === profile.username
                    ? `3px solid ${yellow}`
                    : "3px solid transparent",
              }}
            >
              <ProfileCard
                key={index}
                username={profile.username}
                equities={profile.equities}
                positions={profile.positions}
              />
            </Box>
          );
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

const getFundlevelImage = (equity: number) => {
  if (equity >= 1000000) {
    return '/whale.png';
  }
  if (equity >= 100000) {
    return '/shark.png';
  }
  if (equity >= 10000) {
    return '/octopus.png';
  }
  if (equity >= 1000) {
    return '/crab.png';
  }
  return '/crab.png';
};

const ProfileCard: FC<IProfile> = ({ username, equities, positions }) => {
  const mockLastUpdate = Date.now().toString();
  const totalEquity = Object.values(equities).reduce((tot, { equity }) => {
    return tot + equity;
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
        backgroundColor: "#0d1117", // Darker card background
        border: "1px solid #30363d",
        color: "white",
        maxWidth: '300px'
      }}
    >
      <CardContent>
        <Grid container spacing={1}>
          {/* 1. Datetime & Type (Often prominent info) */}
          <CardItem
            size={4}
            label="updated at"
            valueComponent={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography>{dayjs(new Date(Number(mockLastUpdate))).format("HH:mm")}</Typography>
              </Box>
            }
          />

          <CardItem
            size={4}
            label="username"
            valueComponent={
              <Typography variant="body2" fontWeight="bold">{username}</Typography>
            }
          />

          {/* 2. Status (Often needs prominence) */}
          <Grid size={4}>
            <Box display="flex" justifyContent="flex-end" alignItems="center">
              <Box
                sx={{
                  borderRadius: 8,
                  width: "fit-content",
                  padding: "4px 8px",
                }}
              >
                <img
                  src={getFundlevelImage(totalEquity)}
                  width={40}
                  height={40}
                  alt="Currency icon"
                />
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
