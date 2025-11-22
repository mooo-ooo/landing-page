import { Box, Button, Typography, Skeleton } from "@mui/material";
import numeral from "numeral";
import ConstructionIcon from "@mui/icons-material/Construction";
import type { ExchangeName } from "../../../types/exchange";
import Volume24h from "../Volume24h";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CandleChart from "../CandleChart";
import { useDispatch } from "react-redux";
import readableNumber from "human-readable-numbers";
import type { AppDispatch } from "../../../redux/store";
import type { IPosition } from "../../../redux/positions/positionsSlice";
import {
  setUpdateStrategy,
  setNewStrategy,
  type IStrategy,
} from "../../../redux/strategy/strategySlice";
import {
  // calculateAveragePrice,
  // calculateWeightedAverageFundingRate,
  // percentageChange,
  strip,
  // type IPurchase,
  // type ITransactionWithFundingRate,
} from "../../../helpers";

export interface IDetails {
  foundStrategy?: IStrategy;
  buys: IPosition[];
  sells: IPosition[];
  baseToken: string;
  loadingFundingRates?: boolean;
  equity: number;
  totalVol: number;
  setShownBalanceOrderConfirmationDialog: (token: string) => void;
}

// const toWeightedAverageFundingRate = ({
//   fundingRate,
//   size,
// }: IPosition): ITransactionWithFundingRate => {
//   return {
//     fundingRate,
//     quantity: size,
//   };
// };

// const toAveragePrice = ({ avgPrice, size }: IPosition): IPurchase => {
//   return {
//     price: avgPrice,
//     quantity: size,
//   };
// };

function TableDetailsMobile({
  foundStrategy,
  baseToken,
  buys,
  sells,
  loadingFundingRates,
  equity,
  totalVol,
  setShownBalanceOrderConfirmationDialog,
}: IDetails) {
  const dispatch = useDispatch<AppDispatch>();
  const totalSizeSell = sells.reduce((tot, { size }) => size + tot, 0);
  const totalSizeBuy = buys.reduce((tot, { size }) => size + tot, 0);

  // const buyAvgPrice = calculateAveragePrice(buys.map(toAveragePrice));

  // const sellAvgPrice = calculateAveragePrice(sells.map(toAveragePrice));

  const estimatedFee = [...sells, ...buys].reduce((tot, cur) => {
    return (
      tot +
      cur.markPrice *
        cur.size *
        cur.fundingRate *
        (cur.side === "sell" ? 1 : -1)
    );
  }, 0);
  // const sellFundingRate =
  //   calculateWeightedAverageFundingRate(
  //     sells.map(toWeightedAverageFundingRate)
  //   ) || 0;
  // const buyFundingRate =
  //   calculateWeightedAverageFundingRate(
  //     buys.map(toWeightedAverageFundingRate)
  //   ) || 0;

  // const diffFundingRate =
  //   loadingFundingRates || !sells.length || !buys.length
  //     ? null
  //     : sellFundingRate - buyFundingRate;

  // const spreadRate =
  //   buyAvgPrice && sellAvgPrice
  //     ? percentageChange(buyAvgPrice, sellAvgPrice)
  //     : null;

  const biggestPnL = [...sells, ...buys].reduce(
    (maxExchange, position) => {
      const maxPnL = position.unrealizedPnl || 0;
      return maxPnL > maxExchange.maxPnL
        ? { maxPnL, exchange: position.exchange }
        : maxExchange;
    },
    { maxPnL: 0, exchange: "" }
  );

  const volOfStrategy =
    (totalSizeSell + totalSizeBuy) *
    (sells[0]?.markPrice || buys[0]?.markPrice);

  const capitalAllocated = equity * (volOfStrategy / totalVol);

  const apr =
    loadingFundingRates || !sells.length || !buys.length
      ? null
      : (estimatedFee / capitalAllocated) * 3 * 365 * 100;

  const spreadSize = Math.abs(
    strip(String(totalSizeSell)) - strip(String(totalSizeBuy))
  );

  // const sellCreatedAts = sells.map(({ createdAt }) => createdAt);
  // const buyCreatedAts = buys.map(({ createdAt }) => createdAt);

  // const createdAt = Math.max(...[...sellCreatedAts, ...buyCreatedAts]);
  return (
    <Box my={1}>
      <Box display="flex" justifyContent="flex-end">
        <Button
          onClick={() =>
            foundStrategy
              ? dispatch(
                  setUpdateStrategy({
                    open: true,
                    baseToken,
                  })
                )
              : dispatch(setNewStrategy({ open: true, baseToken }))
          }
          variant="outlined"
          endIcon={<VisibilityIcon />}
        >
          Strategy
        </Button>
      </Box>
      <Box my={1} display="flex" justifyContent="space-between">
        <Typography>Mark price:</Typography>
        <Typography>
          {sells?.length ? (
            readableNumber.toHumanString(sells[0]?.markPrice) + ' USDT'
          ) : (
            <Skeleton animation="wave" />
          )}
        </Typography>
      </Box>
      <Box my={1} display="flex" justifyContent="space-between">
        <Typography color="textSecondary">Total volume:</Typography>
        <Box>
          <Typography>
            {readableNumber.toHumanString(volOfStrategy)}$
          </Typography>
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
      </Box>
      <Box my={1} display="flex" justifyContent="space-between" alignItems="center">
        <Typography color="textSecondary">Unrealized Pnl:</Typography>
        <Box>
          {biggestPnL?.maxPnL > 0 ? (
            <Box
              display="flex"
              width="100%"
              alignItems="center"
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
              <Typography>
                {numeral(biggestPnL.maxPnL).format("0,0")}$
              </Typography>
            </Box>
          ) : (
            <Skeleton animation="wave" />
          )}
        </Box>
      </Box>
      <Box my={1} display="flex" justifyContent="space-between">
        <Typography color="textSecondary">APR:</Typography>
        {apr === null ? (
          <Skeleton animation="wave" />
        ) : (
          <Typography>{numeral(apr).format("0,0.[0]")}%</Typography>
        )}
      </Box>
      <Box my={1} display="flex">
        <Volume24h
          buyExchange={buys[0]?.exchange}
          sellExchange={sells[0]?.exchange}
          baseToken={baseToken}
        />
      </Box>

      <Box>
        <CandleChart
          baseToken={baseToken}
          sellExchanges={sells.map((sell) => sell.exchange as ExchangeName)}
          buyExchanges={buys.map((buy) => buy.exchange as ExchangeName)}
        />
      </Box>
    </Box>
  );
}

export default TableDetailsMobile;
