import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
// import FilterListIcon from "@mui/icons-material/FilterList";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { percentageChange } from "../../helpers";

// Internal components
import BalanceConfirmationDialog from "./BalanceConfirmationDialog";
// import FilterDialog from './FilterDialog'
// import Position from './Position'
// import StrategyDialog from './StrategyDialog'

// Serives
import numeral from "numeral";
// import { strip } from "../../helpers";

// Store
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type {
  PostitionsState,
  IPosition,
} from "../../redux/positions/positionsSlice";

export const DEFAULT_PERCENT_CHANGE_TO_SL = 35;

const changeFromMarkToLiq = ({ markPrice, liqPrice }: IPosition) =>
  Math.abs(percentageChange(markPrice, liqPrice));

function Positions() {
  const [openTransferDialog, setOpenTransferDialog] = useState<boolean>(false);
  // const [openedFilter, setOpenedFilter] = useState<boolean>(false)
  const [selectedExchanges] = useState<string[]>([]);
  const positionsStore = useSelector((state: RootState) => state.positions);

  // const strategies = useSelector((state: RootState) => state.strategies)
  const balances = useSelector((state: RootState) => state.balances);
  // const [selectedTokenStrategy, setSelectedTokenStrategy] = useState<string>()
  const [sortBy] = useState<string>("liquidation|asc");

  // const exchanges: string[] = Object.keys(positionsStore).reduce(
  //   (acu: string[], exName) => {
  //     const exchange =
  //       positionsStore[exName as unknown as keyof PostitionsState]
  //     if (exchange.length) {
  //       const result = [...acu, exName]
  //       return result
  //     }
  //     return acu
  //   },
  //   []
  // )

  const spotPositions: IPosition[] = useMemo(() => {
    return balances.gate.spot.map(({ coin, amount }) => ({
      exchange: "gate",
      side: "spot",
      size: amount,
      baseToken: coin.toUpperCase(),
      liqPrice: Number.NaN,
      avgPrice: Number.NaN,
      markPrice: 0,
      fundingRate: 0,
      liqPriceRatio: Number.NaN,
    }));
  }, [balances]);

  const normalizePositions = () => {
    const posMap: Record<string, { buys: IPosition[]; sells: IPosition[] }> =
      {};
    const positions = Object.keys(positionsStore).reduce(
      (acu: IPosition[], exName) => {
        const exchange =
          positionsStore[exName as unknown as keyof PostitionsState];
        if (exchange.length) {
          const result = [
            ...acu,
            ...exchange.map((ex) => ({
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

    return (
      Object.keys(posMap)
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
        // .filter(({ baseToken }) => {
        //   return strategies.data.find(({ sellSymbol }) => {
        //     return sellSymbol.split('/')[0].toUpperCase() === baseToken
        //   })
        // })
        .filter(({ buys, sells }) => {
          const isSpotNotHedge = buys[0]?.side === "spot" && sells.length === 0;
          return !isSpotNotHedge;
        })
    );
  };

  const positions = normalizePositions();
  const getMaxLiq = useCallback((pos: (typeof positions)[0]) => {
    const maxShortFr = Math.max(...pos.sells.map(changeFromMarkToLiq));
    const maxLongFr = Math.max(...pos.buys.map(changeFromMarkToLiq));
    return Math.max(maxShortFr, maxLongFr);
  }, []);

  const getMinLiq = useCallback((pos: (typeof positions)[0]) => {
    const minShortFr = Math.min(...pos.sells.map(changeFromMarkToLiq));
    const minLongFr = Math.min(...pos.buys.map(changeFromMarkToLiq));
    return Math.min(minLongFr, minShortFr);
  }, []);

  const positionsSorted = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [direction] = sortBy.split("|");
    return positions.sort((a, b) => {
      if (direction === "asc") {
        return getMinLiq(a) - getMinLiq(b);
      } else {
        return getMaxLiq(b) - getMaxLiq(a);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, sortBy]);

  const estimatedFundingFee = positionsSorted
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

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          position: "sticky",
          top: "70px",
          zIndex: 1,
          paddingLeft: "12px",
        }}
      >
        <Typography
          sx={{ fontWeight: "bold", fontSize: "0.85rem", marginRight: 1 }}
          variant="caption"
        >
          Estimated funding: {numeral(estimatedFundingFee).format("0,0.00")}{" "}
          USDT
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid>
          <Box display="flex" flexDirection="column" gap={2}>
            <Paper
              sx={{
                width: "100%",
                overflow: "hidden",
                mb: 2,
                backgroundColor: "#010409",
                border: "1px solid #30363d",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ height: "64px" }}>
                    <TableCell>Base Token</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Mark Price</TableCell>
                    <TableCell>Unrealized.Pnl</TableCell>
                    <TableCell>Liq Price</TableCell>
                    <TableCell>Exchanges</TableCell>
                    <TableCell>Funding Rate</TableCell>
                    <TableCell>Est.Funding Fee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positionsSorted.map(({ sells, buys, baseToken }) => {
                    const estimatedFee = [...sells, ...buys].reduce(
                      (tot, cur) => {
                        return (
                          tot +
                          cur.markPrice *
                            cur.size *
                            cur.fundingRate *
                            (cur.side === "sell" ? 1 : -1)
                        );
                      },
                      0
                    );
                    const totalSizeSell = sells.reduce(
                      (tot, { size }) => size + tot,
                      0
                    );
                    // const totalSizeBuy = buys.reduce(
                    //   (tot, { size }) => size + tot,
                    //   0
                    // );

                    // const spreadSize = Math.abs(strip(String(totalSizeSell)) - strip(String(totalSizeBuy)))
                    return (
                      <TableRow key={baseToken} sx={{ height: "64px" }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <img
                              src={`https://assets.coincap.io/assets/icons/${baseToken.toLowerCase()}@2x.png`}
                              alt={baseToken}
                              width={20}
                              height={20}
                            />
                            <Typography variant="caption" fontWeight="bold">
                              {baseToken}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {formatQuantity(totalSizeSell)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {numeral(sells[0].markPrice).format(
                              precisionMap[baseToken] || "0,0.[0000]"
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            my="12px"
                            display="flex"
                            width="100%"
                            justifyContent="space-between"
                          >
                            <Typography
                              textTransform="capitalize"
                              variant="caption"
                            >
                              [{(sells[0]?.unrealizedPnl || 0) <
                              (buys[0]?.unrealizedPnl || 0)
                                ? buys[0]?.exchange
                                : sells[0]?.exchange}]
                            </Typography>
                            <Typography
                              textTransform="capitalize"
                              variant="caption"
                            >
                              {numeral(
                                Math.max(
                                  sells[0]?.unrealizedPnl || 0,
                                  buys[0]?.unrealizedPnl || 0
                                )
                              ).format("0,0")}{" "}
                              USDT
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography
                              sx={{
                                color: "rgb(246, 70, 93)",
                                mr: 1,
                              }}
                              variant="caption"
                            >
                              {numeral(sells[0].liqPrice).format(
                                precisionMap[baseToken] || "0,0.[0000]"
                              )}
                            </Typography>
                            <Typography
                              sx={{
                                color: "rgb(14, 203, 129)",
                                mr: 1,
                              }}
                              variant="caption"
                            >
                              {numeral(buys[0]?.liqPrice).format(
                                precisionMap[baseToken] || "0,0.[0000]"
                              )}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography
                              sx={{
                                color: "rgb(246, 70, 93)",
                                mr: 1,
                              }}
                              variant="caption"
                            >
                              {sells
                                .map((s) => s.exchange)
                                .join("-")
                                .toUpperCase()}
                            </Typography>

                            <Typography
                              sx={{
                                color: "rgb(14, 203, 129)",
                                mr: 1,
                              }}
                              variant="caption"
                            >
                              {buys
                                .map((s) => s.exchange)
                                .join("-")
                                .toUpperCase()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap={1}
                          >
                            <Typography
                              sx={{
                                color: "rgb(246, 70, 93)",
                                mr: 1,
                              }}
                              variant="caption"
                            >
                              {sells
                                .map(
                                  (s) =>
                                    numeral(s.fundingRate * 100).format(
                                      "0,0.[00]"
                                    ) + "%"
                                )
                                .join("-")}
                            </Typography>

                            <Typography
                              sx={{
                                color: "rgb(14, 203, 129)",
                                mr: 1,
                              }}
                              variant="caption"
                            >
                              {buys
                                .map(
                                  (s) =>
                                    numeral(s.fundingRate * 100).format(
                                      "0,0.[00]"
                                    ) + "%"
                                )
                                .join("-")}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {numeral(estimatedFee).format("0,0.[00]")} USDT
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {openTransferDialog ? (
        <BalanceConfirmationDialog
          id="ringtone-menu"
          keepMounted
          open={openTransferDialog}
          onClose={() => setOpenTransferDialog(false)}
        />
      ) : null}
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          key="transfer"
          icon={<SwapHorizIcon />}
          tooltipTitle="transfer"
          onClick={() => setOpenTransferDialog(true)}
        />
      </SpeedDial>
    </Box>
  );
}

const precisionMap: Record<string, string> = {
  SHIB: "0.0000e+0",
  DOGE: "0,0.0[0000]",
  AVAX: "0,0.00",
  ETC: "0.000",
  SUI: "0,0.000",
};

const nFormatter = (num: number, digits: number) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value);
  return item
    ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol)
    : "0";
};

const formatQuantity = (qty: number) => {
  if (qty > 1000000) {
    return nFormatter(qty, 0);
  }
  return numeral(qty).format("0,0.[000]");
};

export default Positions;
