import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell as TableCellMui,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import { styled } from "@mui/system";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { PieChart } from "@mui/x-charts/PieChart";

import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";

import ExchangeMargin from "../ExchangeMargin";

// Serives
import numeral from "numeral";

// Store
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import type {
  PostitionsState,
  IPosition,
} from "../../redux/positions/positionsSlice";
import { percentageChange } from "../../helpers";
import api from "../../lib/axios";

export const DEFAULT_PERCENT_CHANGE_TO_SL = 35;

function Positions() {
  const localOrderBy = localStorage.getItem("orderBy") || "volume";
  const localOrder = localStorage.getItem("order") || "desc";
  const [order, setOrder] = useState<Order>(localOrder as Order);
  const [orderBy, setOrderBy] = useState<keyof Data>(
    localOrderBy as keyof Data
  );
  const [selectedExchanges] = useState<string[]>([]);
  const positionsStore = useSelector((state: RootState) => state.positions);
  const balances = useSelector((state: RootState) => state.balances);

  const totalMargin = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );

  const [rewardHistory, setRewardHistory] = useState<
    { date: string; value: number }[]
  >([]);

  useEffect(() => {
    api
      .get("/api/v1/account/funding-fees/last-7-days")
      .then((result: { data: { fundingByDay: Record<string, number> } }) => {
        if (
          result.data?.fundingByDay &&
          Object.keys(result.data.fundingByDay).length > 0
        ) {
          const fundingByDay = result.data.fundingByDay;

          const fullToShortMap: Record<string, string> = {
            Monday: "Mon",
            Tuesday: "Tue",
            Wednesday: "Wed",
            Thursday: "Thu",
            Friday: "Fri",
            Saturday: "Sat",
            Sunday: "Sun",
          };

          const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          // Get today's index in short form: 0 = Sun, 1 = Mon, ..., 6 = Sat
          const todayIndex = new Date().getDay();

          // Create circular day order ending with today
          const circularOrder = [
            ...shortDays.slice((todayIndex + 1) % 7),
            ...shortDays.slice(0, (todayIndex + 1) % 7),
          ];

          const mappedHistory = circularOrder.map((shortName) => {
            const fullName = Object.keys(fullToShortMap).find(
              (key) => fullToShortMap[key] === shortName
            )!;
            return {
              date: shortName,
              value: fundingByDay[fullName] || 0,
            };
          });
          console.log({mappedHistory})
          setRewardHistory(mappedHistory);
        }
      })
      .catch((err) => {
        console.error(err)
        setRewardHistory([]);
      });
  }, []);

  const createSortHandler = (property: keyof Data) => () => {
    const isAsc = orderBy === property && order === "asc";
    localStorage.setItem("orderBy", property);
    localStorage.setItem("order", isAsc ? "desc" : "asc");
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

    return Object.keys(posMap)
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
      .filter(({ buys, sells }) => {
        const isSpotNotHedge = buys[0]?.side === "spot" && sells.length === 0;
        return !isSpotNotHedge;
      })
      .map((pos) => {
        return {
          ...pos,
          ...posMap[pos.baseToken],
        };
      });
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

  const equities = useMemo(() => {
    const exchangeColors = {
      coinex: "rgb(14, 173, 152)",
      bitget: "rgb(3, 170, 199)",
      gate: "rgb(35, 84, 230)",
      huobi: "rgb(0, 148, 255)",
      bybit: "rgb(255, 177, 26)",
    };
    return Object.keys(balances).map((key) => {
      return {
        id: key,
        value:
          (balances[key as keyof typeof balances].total / totalMargin) * 100,
        label: `${key}`,
        color: exchangeColors[key as keyof typeof exchangeColors],
      };
    });
  }, [balances, totalMargin]);

  const headCells = getHeadCells(positions.length);
  console.log({ rewardHistory });

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Grid container spacing={4}>
        <Grid size={3.5}>
          <Typography>
            Index Fund: ~{numeral(totalMargin).format("0,0.0")} USDT
          </Typography>
          <PieChart
            series={[
              {
                data: equities,
                innerRadius: 30,
                outerRadius: 100,
                paddingAngle: 1,
                cornerRadius: 3,
                startAngle: -45,
                arcLabel: (item) => `${numeral(item.value).format("0,0")}%`,
                arcLabelMinAngle: 35,
                arcLabelRadius: "60%",
              },
            ]}
            width={250}
            height={250}
          />
        </Grid>

        <Grid size={3.5}>
          <Typography>
            Estimated funding: ${numeral(estimatedFundingFee).format("0,0")}{" "}
            USDT
          </Typography>
          {/* <BarChart
            dataset={rewardHistory}
            {...chartSetting}
            colors={customColors}
            borderRadius={3}
          /> */}
          {rewardHistory.length ? (
            <ChartContainer
              xAxis={[
                {
                  scaleType: "band",
                  data: rewardHistory.map(({ date }) => date),
                },
              ]}
              series={[
                {
                  type: "line",
                  curve: "step",
                  data: getAccumulatedArray(
                    rewardHistory.map(({ value }) => value)
                  ),
                  color: "rgb(14, 203, 129)",
                },
                {
                  data: rewardHistory.map(({ value }) => value),
                  type: "bar",
                  color: "rgb(14, 203, 129)",
                },
              ]}
              height={250}
              margin={{ bottom: 10 }}
            >
              <BarPlot />
              <ChartsAxisHighlight x="band" />
              <LinePlot />
              <MarkPlot />
              <ChartsXAxis />
              <ChartsYAxis />
              <ChartsTooltip />
            </ChartContainer>
          ) : (
            "loading ..."
          )}
        </Grid>
        <Grid size={0.5}></Grid>
        <Grid size={4.5}>
          <ExchangeMargin />
        </Grid>
      </Grid>
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
          <Table>
            <TableHead
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                backgroundColor: "#010409",
              }}
            >
              <TableRow sx={{ height: "64px" }}>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align="left"
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1}
                      sx={{ cursor: headCell.sortable ? "pointer" : "default" }}
                      onClick={
                        headCell.sortable
                          ? createSortHandler(headCell.id)
                          : undefined
                      }
                    >
                      <Typography>{headCell.label}</Typography>
                      {headCell.sortable && orderBy === headCell.id ? (
                        <Box component="span">
                          {order !== "desc" ? (
                            <ArrowUpwardIcon fontSize="small" />
                          ) : (
                            <ArrowDownwardIcon fontSize="small" />
                          )}
                        </Box>
                      ) : null}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map(({ sells, buys, baseToken }) => {
                const estimatedFee = [...sells, ...buys].reduce((tot, cur) => {
                  return (
                    tot +
                    cur.markPrice *
                      cur.size *
                      cur.fundingRate *
                      (cur.side === "sell" ? 1 : -1)
                  );
                }, 0);
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
                  <TableRow key={baseToken}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <img
                          src={`https://assets.coincap.io/assets/icons/${baseToken.toLowerCase()}@2x.png`}
                          alt={baseToken}
                          width={20}
                          height={20}
                        />
                        <Typography fontWeight="bold">{baseToken}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="left">
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
                    </TableCell>

                    <TableCell align="left">
                      <Typography>
                        {numeral(sells[0].markPrice * totalSizeSell * 2).format(
                          "0,0]"
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Typography>
                        {numeral(
                          percentageChange(
                            buys[0]?.avgPrice,
                            sells[0]?.avgPrice
                          )
                        ).format("0.[000]")}
                        %
                      </Typography>
                    </TableCell>
                    <TableCell>
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
                          src={`/${biggestPnLExchange}.png`}
                          alt="USDT"
                          width={20}
                          height={20}
                        />
                        <Typography>
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
                    <TableCell align="left">
                      <Typography>
                        {numeral(sells[0].markPrice).format(
                          precisionMap[baseToken] || "0,0.[0000]"
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="left"
                        gap={1}
                      >
                        <Box display="flex" gap={1} alignItems="space-between">
                          <ArrowUpwardIcon
                            sx={{ color: "rgb(14 203 129 / 40%)" }}
                          />
                          <Typography>
                            {numeral(
                              percentageChange(
                                sells[0].markPrice,
                                sells[0].liqPrice || 0
                              )
                            ).format("0")}
                            %
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1} alignItems="space-between">
                          <ArrowDownwardIcon
                            sx={{ color: "rgb(246 70 93 / 40%)" }}
                          />
                          <Typography>
                            {numeral(
                              percentageChange(
                                buys[0].markPrice,
                                buys[0].liqPrice || 0
                              )
                            ).format("0")}
                            %
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell align="left">
                      <Typography>
                        {numeral(
                          100 * (sells[0].fundingRate - buys[0].fundingRate)
                        ).format("0,0.[00]")}
                        %
                      </Typography>
                    </TableCell>

                    <TableCell align="left">
                      <Typography
                        sx={{
                          color:
                            estimatedFee > 0
                              ? "rgb(14 203 129)"
                              : "rgb(246 70 93)",
                        }}
                        fontWeight="bold"
                      >
                        {numeral(estimatedFee).format("0,0.[00]")}$
                      </Typography>
                    </TableCell>
                    <TableCell align="left">
                      <Typography>
                        {numeral(
                          (100 *
                            (sells[0].fundingRate - buys[0].fundingRate) *
                            360 *
                            3) /
                            2
                        ).format("0,0")}
                        %
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  );
}

const precisionMap: Record<string, string> = {
  SHIB: "0.0000e+0",
  DOGE: "0,0.0[0000]",
  BONK: "0,0.0[0000]",
  AVAX: "0,0.00",
  ETC: "0.000",
  SUI: "0,0.000",
};

export default Positions;

const getHeadCells = (numberOfToken: number): readonly HeadCell[] => [
  {
    id: "baseToken",
    numeric: false,
    disablePadding: true,
    label: `Token (${numberOfToken})`,
  },
  {
    id: "exchanges",
    numeric: true,
    disablePadding: false,
    label: "Exchanges",
  },

  {
    id: "volume",
    numeric: true,
    disablePadding: false,
    label: "Volume",
    sortable: true,
  },
  {
    id: "premium",
    numeric: true,
    disablePadding: false,
    label: "%Premium",
  },
  {
    id: "unrealizedPnl",
    numeric: true,
    disablePadding: false,
    label: "Unrealized.Pnl",
    sortable: true,
  },
  {
    id: "markPrice",
    numeric: true,
    disablePadding: false,
    label: "Mark Price",
    sortable: false,
  },
  {
    id: "liqPrice",
    numeric: true,
    disablePadding: false,
    label: "Liq.Price %",
    sortable: true,
  },

  {
    id: "fundingRate",
    numeric: true,
    disablePadding: false,
    label: "Funding Rate",
    sortable: false,
  },
  {
    id: "estimatedFee",
    numeric: true,
    disablePadding: false,
    label: "Est.Reward",
    sortable: true,
  },
  {
    id: "apr",
    numeric: true,
    disablePadding: false,
    label: "APR",
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
  if (orderBy === "apr") {
    const aprA = a.sells[0].fundingRate - a.buys[0].fundingRate;
    const aprB = b.sells[0].fundingRate - b.buys[0].fundingRate;
    return aprB - aprA;
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
  apr: number;
  premium: string;
}

const TableCell = styled(TableCellMui)(() => ({
  padding: "8px 16px",
}));

const getAccumulatedArray = (arr: number[]): number[] => {
  // A variable to store the running total.
  let runningSum = 0;

  // We use the `map` method to create a new array.
  // The `map` callback function takes each number in the original array
  // and updates the running sum.
  return arr.map((num) => {
    runningSum += num;
    return runningSum;
  });
};
