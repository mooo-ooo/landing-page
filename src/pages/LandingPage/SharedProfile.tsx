import { useMemo, useEffect, useState, type FC } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Skeleton
} from "@mui/material";
import { green } from "../../constants/colors";
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";
import PositionsTable from "../../components/PositionsTable";
import numeral from "numeral";
import readableNumber from "human-readable-numbers";
import { useSharedFundingRates } from "../../hooks";
import { calculateDaysBack } from "../../helpers";
import { normalizedSharedPositions } from "../../hooks/useNormalizedPositions";
import { type PostitionsState } from "../../redux/positions/positionsSlice";
import { selectBalances } from "../../redux/balances/balancesSlice";
import type { ExchangeName } from "../../types/exchange";
import api from "../../lib/axios";
import { useSelector } from "react-redux";
import { LineChart } from "@mui/x-charts";
import { useDrawingArea } from "@mui/x-charts/hooks";

interface IEquity {
  equity: number;
  available: number;
}

interface IProfile {
  createdAt: Date;
  username: string;
  equities: Record<ExchangeName, IEquity>;
  positions: PostitionsState;
  earnedFundingFees: {
    totalFees: number;
    fundingByDay: { date: string; total: number }[];
  };
}

const Share: FC = () => {
  const isWeb = useMediaQuery("(min-width:600px)");
  const balances = useSelector(selectBalances);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<IProfile | null>(null);
  const [profiles, setProfiles] = useState<IProfile[]>([]);

  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  useEffect(() => {
    setIsLoading(true);
    console.log('debiug')
    api
      .get(`api/v1/public/portfolio`)
      .then(({ data }) => {
        setProfiles(
          Object.keys(data).filter(key => key === 'xapy').map((key) => ({
            username: key,
            equities: data[key].equities || {},
            positions: data[key].positions || {},
            earnedFundingFees: data[key].earnedFundingFees || {},
            createdAt: data[key].createdAt || Date.now(),
          }))
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const { fundingRates, loading: loadingFundingRates } = useSharedFundingRates(
    selectedProfile?.positions
  );
  const positionsWithFunding = useMemo(() => {
    const positions = selectedProfile?.positions
      ? normalizedSharedPositions(selectedProfile?.positions)
      : [];
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



  return (
    <Grid container spacing={4} alignItems="center">
      <Grid
        size={isWeb ? 8 : 12}
        sx={{ textAlign: { xs: "center", md: "left" } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 2,
            }}
          >
            Shared Portfolio
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mb: 3,
              fontWeight: 500,
            }}
          >
            View a real shared portfolio, data is snapshotted every 1 hour,
            click to view his detailed positions.
          </Typography>

          <Typography sx={{textDecoration: 'underline'}} fontStyle='italic'>View Portfolio Now</Typography>
        </Box>
      </Grid>

      <Grid size={isWeb ? 4 : 12}>
        {isLoading || profiles.length === 0 ? (
          <Box sx={{ width: "100%" }}>
            <Skeleton height={64} />
            <Skeleton animation="wave" height={64} />
            <Skeleton animation={false} height={64} />
          </Box>
        ) : (
          <Box
            onClick={() => {
              setSelectedProfile(profiles[0]);
            }}
            padding={0}
            sx={{
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            <ProfileCard {...profiles[0]} />
          </Box>
        )}
      </Grid>
      <Dialog
        fullScreen={true}
        open={selectedProfile !== null}
        onClose={() => setSelectedProfile(null)}
      >
        <DialogTitle sx={{ fontSize: 16, background: "#1e2026" }}>
          {selectedProfile?.username}'s positions
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setSelectedProfile(null)}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent
          sx={{
            padding: 0,
            maxHeight: isWeb ? "100vh" : "90vh",
            background: "#1e2026",
          }}
        >
          <Box ml={3} display="flex" alignItems="center" gap={1} mb={2}>
            <Typography>
              Estimated next funding fee:{" "}
              {numeral(estimatedFundingFee).format("0,0.00")}
            </Typography>
            <img
              src={`https://assets.coincap.io/assets/icons/usdt@2x.png`}
              width={20}
              height={20}
              alt="Currency icon"
            />
          </Box>

          <PositionsTable
            strategies={[]}
            positions={positionsWithFunding}
            loadingFundingRates={loadingFundingRates}
            exchanges={exchanges}
            error={null}
            isSharedView={true}
          />
        </DialogContent>
      </Dialog>
    </Grid>
  );
};

const getFundlevelImage = (equity: number) => {
  if (equity >= 1000000) {
    return "/whale.png";
  }
  if (equity >= 100000) {
    return "/shark.png";
  }
  if (equity >= 10000) {
    return "/octopus.png";
  }
  if (equity >= 1000) {
    return "/crab.png";
  }
  return "/crab.png";
};

const ProfileCard: FC<IProfile> = ({
  username,
  equities,
  positions,
  createdAt,
  earnedFundingFees,
}) => {
  const totalEquity = Object.values(equities).reduce((tot, { equity }) => {
    return tot + equity;
  }, 0);
  const totalVol = Object.values(positions)
    .flat()
    .reduce((tot, { size, markPrice }) => {
      return tot + size * markPrice;
    }, 0);
  const rewardHistory = earnedFundingFees.fundingByDay || [];

  return (
    <Card
      // elevation={1}
      key={username}
      sx={{
        backgroundColor: "#121212", // Darker card background
        border: "1px solid #30363d",
        color: "white",
      }}
    >
      <CardContent>
        <Grid container>
          {/* 1. Datetime & Type (Often prominent info) */}
          <CardItem
            size={4}
            label="Age"
            valueComponent={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography>
                  {calculateDaysBack(new Date(createdAt).getTime())} days
                </Typography>
              </Box>
            }
          />

          <CardItem
            size={4}
            label="Username"
            valueComponent={
              <Typography textAlign='left' variant="h6" fontWeight="bold">
                {username}
              </Typography>
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
                  width={30}
                  height={30}
                  alt="Currency icon"
                />
              </Box>
            </Box>
          </Grid>
          <Grid size={12}>
            <hr style={{ border: "1px solid #30363d" }} />
          </Grid>

          {/* 4. To Address */}
          <CardItem
            size={8}
            label="Accumulated Pnl (30d)"
            valueComponent={
              <Box display="flex" alignItems="center" gap={0.5}>
                <img
                  src={`https://assets.coincap.io/assets/icons/usdt@2x.png`}
                  width={20}
                  height={20}
                  alt="Currency icon"
                />
                <Typography>
                  {numeral(earnedFundingFees.totalFees).format("0,0")}
                </Typography>
              </Box>
            }
          />

          {/* 5. APR */}
          <CardItem
            size={4}
            label="APR (30d)"
            valueComponent={
              <Typography textAlign='left' color={green}>
                {numeral(
                  (((365 / 30) * earnedFundingFees.totalFees) / totalEquity) *
                    100
                ).format("0,0.0")}
                %
              </Typography>
            }
          />

          {/* Chart */}
          <Grid size={12}>
            <LineChart
              height={120}
              margin={{
                bottom: 0,
                left: 0,
              }}
              series={[
                {
                  data: rewardHistory.map(({ total }) => total),
                  area: true, // Enable area fill
                  color: "url(#areaGradient)",
                  showMark: false,
                },
              ]}
              yAxis={[
                {
                  disableLine: true,
                  disableTicks: true,
                  tickLabelInterval: () => false,
                  tickMinStep: 10,
                },
              ]}
              xAxis={[
                {
                  disableLine: true,
                  disableTicks: true,
                  tickLabelInterval: () => false,
                  scaleType: "point",
                  data: rewardHistory.map(({ date }) => date),
                },
              ]}
            >
              <ChartGradient />
            </LineChart>
          </Grid>

          {/* 3. Equity */}
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
                <Typography textAlign='left'>{numeral(totalEquity).format("0,0")}</Typography>
              </Box>
            }
          />
          <CardItem
            size={5}
            label="Volumes"
            valueComponent={
              <Typography textAlign='left' textTransform="capitalize">
                {readableNumber.toHumanString(totalVol)}
              </Typography>
            }
          />
          <CardItem
            size={2}
            label="leverage"
            valueComponent={
              <Typography textAlign='left' textTransform="capitalize">
                x{numeral(totalVol / totalEquity).format("0,0.0")}
              </Typography>
            }
          />
        </Grid>
      </CardContent>
    </Card>
  );
};

const ChartGradient = () => {
  const { top, bottom, height } = useDrawingArea();
  const svgHeight = top + bottom + height;

  return (
    <defs>
      <linearGradient
        id="areaGradient"
        x1="0"
        y1="0"
        x2="0"
        y2={`${svgHeight}px`}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="30%" stopColor="rgb(14, 203, 129" stopOpacity={1} />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0.13)" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
};

const CardItem = ({
  label,
  valueComponent,
  size = 4,
}: {
  label: string;
  valueComponent: React.ReactNode;
  size?: number;
}) => (
  <Grid size={size}>
    <Typography textAlign='left' variant="subtitle2" color="rgba(255, 255, 255, 0.4)">
      {label}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{valueComponent}</Box>
  </Grid>
);

export default Share;
