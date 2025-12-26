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
  Stack,
  IconButton,
  Chip,
  Skeleton,
  Autocomplete,
  TextField
} from "@mui/material";
import { green } from "../constants/colors";
import CloseIcon from "@mui/icons-material/Close";
import { Sort as SortIcon } from "@mui/icons-material";
import { toHumanString } from "../services/humanReadable";
import useMediaQuery from "@mui/material/useMediaQuery";
import PositionsTable from "../components/PositionsTable";
import { selectStrategies } from "../redux/strategy/strategySlice";
import numeral from "numeral";
import { useSharedFundingRates } from "../hooks";
import { calculateDaysBack } from "../helpers";
import { normalizedSharedPositions } from "../hooks/useNormalizedPositions";
import { type PostitionsState } from "../redux/positions/positionsSlice";
import { selectBalances } from "../redux/balances/balancesSlice";
import type { ExchangeName } from "../types/exchange";
import api from "../lib/axios";
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

const filterBy = ["Fund", "Apr", "Earned", "Volume"];

const Share: FC = () => {
  const isWeb = useMediaQuery("(min-width:600px)");
  const balances = useSelector(selectBalances);
  const strategies = useSelector(selectStrategies);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>("fund");
  const [selectedProfile, setSelectedProfile] = useState<IProfile | null>(null);
  const [profiles, setProfiles] = useState<IProfile[]>([]);

  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  useEffect(() => {
    setIsLoading(true);
    api
      .get(`api/v1/shared-profile/portfolio`)
      .then(({ data }) => {
        setProfiles(
          Object.keys(data).map((key) => ({
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
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Typography variant="h4" mt={2} component="h1">
        Shared Profiles
      </Typography>
      <Typography fontStyle="italic" color="textSecondary">
        * Apr is calculated based on funding fees earned over the last 30 days.
        Past performance does not indicate future results. Actual profit and
        loss may vary with market conditions.
      </Typography>
      <Box height={16} />

      <Box
        display="flex"
        justifyContent="space-between"
        width="100%"
        alignItems="center"
      >
        <Box
          display="flex"
          gap={4}
          flexDirection={isWeb ? 'row' : 'column'} 
          width="100%"
          // alignItems="center"
          justifyContent="space-between"
        >
          <Box display="flex" alignItems="center">
            <SortIcon sx={{ mr: 1 }} />
            <Stack
              direction="row"
              spacing={isWeb ? 2 : 0.5}
              alignItems="center"
            >
              {filterBy.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  variant={selectedSort === filter ? "outlined" : "filled"}
                  onClick={() => setSelectedSort(filter)}
                />
              ))}
            </Stack>
          </Box>

          <Box display='flex' justifyContent='space-between' alignItems='center'>
            {!isWeb ? <Typography mb={1} color="textSecondary">
              Search by username
            </Typography> : null}
            <Autocomplete
              freeSolo
              sx={{ width: isWeb ? 300 : 150 }}
              options={profiles.map((option) => option.username)}
              onChange={(_, newValue: string | null) => {
                const foundProfile = profiles.find(
                  (profile) => profile.username === newValue
                );
                if (foundProfile) {
                  setSelectedProfile(foundProfile);
                } else {
                  setSelectedProfile(null);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={isWeb ? "Search username" : null}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      // size: "small",
                      type: "search",
                    },
                  }}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ width: "100%" }}>
          <Skeleton height={64} />
          <Skeleton animation="wave" height={64} />
          <Skeleton animation={false} height={64} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {profiles?.map((profile, index) => {
            return (
              <Grid
                key={index}
                onClick={() => {
                  setSelectedProfile(profile);
                }}
                size={isWeb ? 3 : 12}
                padding={0}
                sx={{
                  cursor: "pointer",
                  borderRadius: 2,
                  borderBottom:
                    selectedProfile?.username === profile.username
                      ? `3px solid #009688`
                      : "3px solid transparent",
                }}
              >
                <ProfileCard key={index} {...profile} />
              </Grid>
            );
          })}
        </Grid>
      )}
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
            strategies={strategies}
            positions={positionsWithFunding}
            loadingFundingRates={loadingFundingRates}
            exchanges={exchanges}
            error={null}
            isSharedView={true}
          />
        </DialogContent>
      </Dialog>
    </Box>
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
      elevation={1}
      key={username}
      sx={{
        backgroundColor: "#0d1117", // Darker card background
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
              <Typography variant="h6" fontWeight="bold">
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
              <Typography color={green}>
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
                <Typography>{numeral(totalEquity).format("0,0")}</Typography>
              </Box>
            }
          />
          <CardItem
            size={5}
            label="Volumes"
            valueComponent={
              <Typography textTransform="capitalize">
                {toHumanString(totalVol)}
              </Typography>
            }
          />
          <CardItem
            size={2}
            label="leverage"
            valueComponent={
              <Typography textTransform="capitalize">
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
    <Typography variant="subtitle2" color="rgba(255, 255, 255, 0.4)">
      {label}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{valueComponent}</Box>
  </Grid>
);

export default Share;
