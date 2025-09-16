import { Box, Typography, Skeleton, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/system";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import ConstructionIcon from "@mui/icons-material/Construction";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import numeral from "numeral";
import {
  calculateAveragePrice,
  calculateWeightedAverageFundingRate,
  percentageChange,
  strip,
  calculateDaysBack,
  type IPurchase,
  type ITransactionWithFundingRate,
} from "../../helpers";
import type { IPosition } from "../../redux/positions/positionsSlice";

const toAveragePrice = ({ avgPrice, size }: IPosition): IPurchase => {
  return {
    price: avgPrice,
    quantity: size,
  };
};

const toWeightedAverageFundingRate = ({
  fundingRate,
  size,
}: IPosition): ITransactionWithFundingRate => {
  return {
    fundingRate,
    quantity: size,
  };
};

export const createPositionsTable = ({
  positions,
  loadingFundingRates,
  equity,
  totalVol,
  openTokenDetails,
  setOpenTokenDetails,
  setShownBalanceOrderConfirmationDialog
}: {
  positions: {
    buys: IPosition[];
    sells: IPosition[];
    baseToken: string;
  }[];
  loadingFundingRates: boolean;
  equity: number;
  totalVol: number;
  openTokenDetails: string;
  setShownBalanceOrderConfirmationDialog: (token: string) => void;
  setOpenTokenDetails: (token: string) => void;
}) => {
  return positions.map(({ baseToken, sells, buys }) => {
    const estimatedFee = [...sells, ...buys].reduce((tot, cur) => {
      return (
        tot +
        cur.markPrice *
          cur.size *
          cur.fundingRate *
          (cur.side === "sell" ? 1 : -1)
      );
    }, 0);
    const totalSizeSell = sells.reduce((tot, { size }) => size + tot, 0);
    const totalSizeBuy = buys.reduce((tot, { size }) => size + tot, 0);

    const buyAvgPrice = calculateAveragePrice(buys.map(toAveragePrice));

    const sellAvgPrice = calculateAveragePrice(sells.map(toAveragePrice));

    const sellFundingRate =
      calculateWeightedAverageFundingRate(
        sells.map(toWeightedAverageFundingRate)
      ) || 0;
    const buyFundingRate =
      calculateWeightedAverageFundingRate(
        buys.map(toWeightedAverageFundingRate)
      ) || 0;

    const diffFundingRate =
      loadingFundingRates || !sells.length || !buys.length
        ? null
        : sellFundingRate - buyFundingRate;

    const spreadRate =
      buyAvgPrice && sellAvgPrice
        ? percentageChange(buyAvgPrice, sellAvgPrice)
        : null;

    const biggestPnL = [...sells, ...buys].reduce(
      (maxExchange, position) => {
        const maxPnL = position.unrealizedPnl || 0;
        return maxPnL > maxExchange.maxPnL
          ? { maxPnL, exchange: position.exchange }
          : maxExchange;
      },
      { maxPnL: 0, exchange: "" }
    );

    const distToLiqBuy = Math.max(
      100 -
        Math.abs(percentageChange(buys[0]?.markPrice, buys[0]?.liqPrice || 0)),
      0
    );
    const distToLiqSell = Math.max(
      100 -
        Math.abs(percentageChange(sells[0]?.markPrice, sells[0]?.liqPrice || 0)),
      0
    );

    const volOfStrategy = (totalSizeSell + totalSizeBuy) * sells[0]?.markPrice;

    const capitalAllocated = equity * (volOfStrategy / totalVol);

    const apr =
      loadingFundingRates || !sells.length || !buys.length
        ? null
        : (estimatedFee / capitalAllocated) * 3 * 365 * 100;

    const spreadSize = Math.abs(
      strip(String(totalSizeSell)) - strip(String(totalSizeBuy))
    );

    const sellCreatedAts = sells.map(({ createdAt }) => createdAt);
    const buyCreatedAts = buys.map(({ createdAt }) => createdAt);

    const createdAt = Math.min(...[...sellCreatedAts, ...buyCreatedAts]);
    
    const cells = [
      {
        id: "baseToken",
        component: (
          <Box display="flex" alignItems="center" gap={1}>
            <img
              src={`https://assets.coincap.io/assets/icons/${baseToken.toLowerCase()}@2x.png`}
              alt={baseToken}
              width={20}
              height={20}
            />
            <Typography>{baseToken}</Typography>
          </Box>
        ),
      },
      {
        id: "exchanges",
        component: (
          <Box display="flex" flexDirection="column" gap={1}>
            <Typography
              sx={{
                color: "rgb(246, 70, 93)",
                mr: 1,
              }}
            >
              {sells.map((s) => s.exchange).join("-")}
            </Typography>

            <Typography
              sx={{
                color: "rgb(14, 203, 129)",
                mr: 1,
              }}
            >
              {buys.map((s) => s.exchange).join("-")}
            </Typography>
          </Box>
        ),
      },
      {
        value: volOfStrategy,
        id: "volume",
        component: (
          <Box>
            <Typography>{numeral(volOfStrategy).format("0,0]")}$</Typography>
            {spreadSize ? (
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  border: "1px solid rgb(246, 70, 93)",
                  padding: "0 4px",
                  borderRadius: "2px",
                  cursor: "pointer",
                  width: "fit-content",
                }}
                onClick={() => setShownBalanceOrderConfirmationDialog(baseToken)}
              >
                <ConstructionIcon
                  sx={{ fill: "rgb(246, 70, 93)", fontSize: 16 }}
                />
                <Typography color="rgb(246, 70, 93)" ml={1}>
                  {numeral(spreadSize * sells[0]?.markPrice).format("0,0")}$
                </Typography>
              </Box>
            ) : null}
          </Box>
        ),
      },
      {
        id: "spreadRate",
        value: spreadRate,
        component:
          spreadRate !== null ? (
            <Typography>{numeral(spreadRate).format("0.[000]")}%</Typography>
          ) : (
            <Skeleton animation="wave" />
          ),
      },
      {
        id: "unrealizedPnl",
        value: biggestPnL.maxPnL,
        component: biggestPnL?.maxPnL > 0 ? (
          <Box
            my="12px"
            display="flex"
            width="100%"
            alignItems="center"
            gap={1}
          >
            <img
              style={{
                borderRadius: "50%",
              }}
              src={`/${biggestPnL.exchange}.png`}
              alt="USDT"
              width={20}
              height={20}
            />
            <Typography>{numeral(biggestPnL.maxPnL).format("0,0")}$</Typography>
          </Box>
        ) : (
          <Skeleton animation="wave" />
        ),
      },
      {
        id: "markPrice",
        component: (
          <Tooltip title={sells[0]?.exchange}>
            <Typography>
              {sells.length ? (
                numeral(sells[0]?.markPrice).format(
                  precisionMap[baseToken] || "0,0.[000]"
                )
              ) : (
                <Skeleton animation="wave" />
              )}
            </Typography>
          </Tooltip>
        ),
      },
      {
        id: "liqPrice",
        component: (
          <Box display="flex" flexDirection="column" alignItems="left" gap={1}>
            <Box display="flex" gap={1} alignItems="space-between">
              {sells.length ? (
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontSize="10px">
                      {numeral(distToLiqSell).format("0,0")}%
                    </Typography>
                    <Typography fontSize="10px">
                      {numeral(sells[0]?.liqPrice).format(
                        precisionMap[baseToken] || "0,0.[000]"
                      )}
                      $
                    </Typography>
                  </Box>

                  <BorderLinearProgress
                    sx={{ width: 124 }}
                    variant="determinate"
                    value={distToLiqSell}
                  />
                </Box>
              ) : (
                <Skeleton animation="wave" />
              )}
            </Box>
            <Box display="flex" gap={1} alignItems="space-between">
              {buys.length ? (
                <Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography fontSize="10px">
                      {numeral(distToLiqBuy).format("0,0")}%
                    </Typography>
                    <Typography fontSize="10px">
                      {numeral(buys[0]?.liqPrice).format(
                        precisionMap[baseToken] || "0,0.[0000]"
                      )}
                      $
                    </Typography>
                  </Box>
                  <BorderLinearProgress
                    sx={{ width: 124 }}
                    variant="determinate"
                    value={distToLiqBuy}
                  />
                </Box>
              ) : (
                <Skeleton animation="wave" />
              )}
            </Box>
          </Box>
        ),
      },
      {
        id: "fundingRate",
        value: diffFundingRate,
        component:
          diffFundingRate !== null ? (
            <Box>
              <Tooltip
                placement="top-start"
                title={`${numeral(100 * sellFundingRate).format(
                  "0,0.[000]"
                )} - ${numeral(100 * buyFundingRate).format("0,0.[000]")}`}
              >
                <Typography>
                  {numeral(100 * diffFundingRate).format("0,0.[000]")}%
                </Typography>
              </Tooltip>
            </Box>
          ) : (
            <Skeleton animation="wave" />
          ),
      },
      {
        id: "estimatedFee",
        value: estimatedFee,
        component: (
          <Typography
            sx={{
              color: estimatedFee > 0 ? "rgb(14 203 129)" : "rgb(246 70 93)",
            }}
            fontWeight="bold"
          >
            {numeral(estimatedFee).format("0,0.[00]")}$
          </Typography>
        ),
      },
      {
        id: "apr",
        value: apr,
        component:
          apr === null ? (
            <Skeleton animation="wave" />
          ) : (
            <Typography>{numeral(apr).format("0,0.[0]")}%</Typography>
          ),
      },
      {
        id: "age",
        value: createdAt,
        component: <Typography>{calculateDaysBack(createdAt)} days</Typography>,
      },
      {
        id: "actions",
        component: (
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {
              if (openTokenDetails === baseToken) {
                setOpenTokenDetails("");
              } else {
                setOpenTokenDetails(baseToken);
              }
            }}
          >
            {openTokenDetails === baseToken ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        ),
      },
    ];
    return {
      baseToken,
      sells,
      buys,
      cells,
    };
  });
};

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 2,
  borderRadius: 2,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: "red",
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.grey[800],
    }),
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: "rgb(246, 70, 93)",
    ...theme.applyStyles("dark", {
      backgroundColor: "rgb(246, 70, 93)",
    }),
  },
}));

const precisionMap: Record<string, string> = {
  SHIB: "0.0000e+0",
  DOGE: "0,0.0[0000]",
  BONK: "0,0.0[0000]",
  AVAX: "0,0.00",
  ETC: "0.000",
  SUI: "0,0.000",
  BTC: "0,0",
  LTC: "0,0",
  XRP: "0,0.00",
};
