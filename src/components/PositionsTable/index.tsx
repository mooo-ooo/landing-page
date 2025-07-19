import { useState, useMemo } from "react";
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
  TableSortLabel,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
// import { percentageChange } from "../../helpers";

// Internal components
import BalanceConfirmationDialog from "./BalanceConfirmationDialog";

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

function Positions() {
  const [openTransferDialog, setOpenTransferDialog] = useState<boolean>(false);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<keyof Data>("volume");
  const [selectedExchanges] = useState<string[]>([]);
  const positionsStore = useSelector((state: RootState) => state.positions);
  const balances = useSelector((state: RootState) => state.balances);

  const createSortHandler = (property: keyof Data) => () => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property as keyof IPosition);
  };

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
        .map((pos) => {
          return {
            ...pos,
            ...posMap[pos.baseToken],
          };
        })
    );
  };

  const positions = normalizePositions();

  const estimatedFundingFee = positions
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

  const visibleRows = useMemo(
    () => [...positions].sort(getComparator(order, orderBy)),
    [order, orderBy, positions]
  );

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
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? "right" : "left"}
                        // padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        <TableSortLabel
                          active={headCell.sortable && orderBy === headCell.id}
                          hideSortIcon={!headCell.sortable}
                          direction={orderBy === headCell.id ? order : "asc"}
                          onClick={createSortHandler(headCell.id)}
                        >
                          <Typography variant="caption">
                            {headCell.label}
                          </Typography>
                          {headCell.sortable && orderBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === "desc"
                                ? "sorted descending"
                                : "sorted ascending"}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleRows.map(({ sells, buys, baseToken }) => {
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
                    const biggestPnLExchange = [...sells, ...buys].reduce(
                      (maxExchange, position) => {
                        const maxPnL = position.unrealizedPnl || 0;
                        return maxPnL > maxExchange.maxPnL
                          ? { maxPnL, exchange: position.exchange }
                          : maxExchange;
                      },
                      { maxPnL: 0, exchange: "" }
                    ).exchange;

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
                            {numeral(
                              sells[0].markPrice * totalSizeSell * 2
                            ).format("0,0]")}
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
                            gap={1}
                          >
                            <img
                              style={{
                                borderRadius: "50%",
                              }}
                              src={`/${biggestPnLExchange}.png`}
                              alt="USDT"
                              width={20}
                              height={20}
                            />
                            <Typography
                              variant="caption"
                            >
                              {numeral(
                                Math.max(
                                  ...[...sells, ...buys].map(
                                    (pos) => pos.unrealizedPnl || 0
                                  )
                                )
                              ).format("0,0")}
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
                            {numeral(estimatedFee).format("0,0.[00]")}$
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

// const formatQuantity = (qty: number) => {
//   if (qty > 1000000) {
//     return nFormatter(qty, 0);
//   }
//   return numeral(qty).format("0,0.[000]");
// };

export default Positions;

const headCells: readonly HeadCell[] = [
  {
    id: "baseToken",
    numeric: false,
    disablePadding: true,
    label: "Base Token",
  },
  {
    id: "volume",
    numeric: true,
    disablePadding: false,
    label: "Volume",
    sortable: true,
  },
  {
    id: "markPrice",
    numeric: true,
    disablePadding: false,
    label: "M.Price",
    sortable: false,
  },
  {
    id: "unrealizedPnl",
    numeric: true,
    disablePadding: false,
    label: "Unrealized.Pnl",
    sortable: true,
  },
  {
    id: "liqPrice",
    numeric: true,
    disablePadding: false,
    label: "Liq.Price",
    sortable: false,
  },
  {
    id: "exchanges",
    numeric: true,
    disablePadding: false,
    label: "Exchanges",
  },
  {
    id: "fundingRate",
    numeric: true,
    disablePadding: false,
    label: "F.Rate",
    sortable: false,
  },
  {
    id: "estimatedFee",
    numeric: true,
    disablePadding: false,
    label: "Est.Fee",
    sortable: true,
  },
];

function descendingComparator<T>(
  a: IPositionWithBuysAndSells,
  b: IPositionWithBuysAndSells,
  orderBy: keyof T
) {
  if (orderBy === "baseToken") {
    return a.baseToken.localeCompare(b.baseToken);
  }
  if (orderBy === "volume") {
    const totalVolumeA = a.sells.reduce(
      (acc, sell) => acc + sell.markPrice * sell.size * 2,
      0
    );
    const totalVolumeB = b.sells.reduce(
      (acc, sell) => acc + sell.markPrice * sell.size * 2,
      0
    );
    return totalVolumeB - totalVolumeA;
  }
  if (orderBy === "estimatedFee") {
    const estimatedFeeA = [...a.sells, ...a.buys].reduce(
      (acc, pos) =>
        acc +
        pos.markPrice *
          pos.size *
          pos.fundingRate *
          (pos.side === "sell" ? 1 : -1),
      0
    );
    const estimatedFeeB = [...b.sells, ...b.buys].reduce(
      (acc, pos) =>
        acc +
        pos.markPrice *
          pos.size *
          pos.fundingRate *
          (pos.side === "sell" ? 1 : -1),
      0
    );
    return estimatedFeeB - estimatedFeeA;
  }
  if (orderBy === "unrealizedPnl") {
    const maxUnrealizedPnlA = Math.max(
      ...[...a.sells, ...a.buys].map((pos) => pos.unrealizedPnl || 0)
    );
    const maxUnrealizedPnlB = Math.max(
      ...[...b.sells, ...b.buys].map((pos) => pos.unrealizedPnl || 0)
    );
    return maxUnrealizedPnlB - maxUnrealizedPnlA;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator(
  order: Order,
  orderBy: keyof Data
): (a: IPositionWithBuysAndSells, b: IPositionWithBuysAndSells) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface IPositionWithBuysAndSells {
  buys: IPosition[];
  sells: IPosition[];
  baseToken: string;
}
interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
  sortable?: boolean;
}

interface Data extends IPosition {
  exchanges: string;
  fundingRate: number;
  estimatedFee: number;
  volume: number;
}
