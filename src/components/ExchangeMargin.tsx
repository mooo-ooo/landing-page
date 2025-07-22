import { useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Tooltip,
} from "@mui/material";
import MoneyIcon from "@mui/icons-material/Money";
import type { RootState } from "../redux/store";
import numeral from "numeral";
import { useSelector } from "react-redux";
import { useBalances } from "../redux/selector";
import type { IFuture } from "../redux/balances/balancesSlice";
import type {
  PostitionsState,
  IPosition,
} from "../redux/positions/positionsSlice";
import { percentageChange } from "../helpers";

const WARNING_LEV = 6;
function ExchangeMargin() {
  const balances = useSelector((state: RootState) => state.balances);
  const positions = useSelector((state: RootState) => state.positions);
  const { leverage } = useBalances();

  const nearestLiqEchange = useMemo(() => {
    const result: Record<
      string,
      { sell: IPosition | null; buy: IPosition | null }
    > = {};
    for (const exName in positions) {
      const ex = positions[exName as keyof PostitionsState];
      if (!ex.length) {
        continue;
      }
      const sellSide = ex.filter(
        ({ markPrice, liqPrice }) => markPrice > liqPrice
      );
      const nearestSellLiq = sellSide.length
        ? sellSide.reduce(function (prev, current) {
            const prevLiq = percentageChange(prev.markPrice, prev.liqPrice);
            const curLiq = percentageChange(
              current.markPrice,
              current.liqPrice
            );
            if (isNaN(curLiq)) {
              return prev;
            }
            return prev && Math.abs(prevLiq || 0) < Math.abs(curLiq || 0)
              ? prev
              : current;
          })
        : null;
      const buySide = ex.filter(
        ({ markPrice, liqPrice }) => markPrice < liqPrice
      );
      const nearestBuyLiq = buySide.length
        ? buySide.reduce(function (prev, current) {
            const prevLiq = percentageChange(prev.markPrice, prev.liqPrice);
            const curLiq = percentageChange(
              current.markPrice,
              current.liqPrice
            );
            if (isNaN(curLiq)) {
              return prev;
            }
            return prev && Math.abs(prevLiq || 0) < Math.abs(curLiq || 0)
              ? prev
              : current;
          })
        : null;
      result[exName] = {
        sell: nearestSellLiq,
        buy: nearestBuyLiq,
      };
    }
    return result;
  }, [positions]);

  return (
    <Box display="flex" flexDirection="column" gap="16px">
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
            <TableRow sx={{ height: "48px" }}>
              <TableCell align="left">
                Exchange (x{numeral(leverage).format("0,0.00")})
              </TableCell>

              <TableCell align="left">Equity</TableCell>
              <TableCell align="left">Available</TableCell>
              <TableCell align="left">Liquidation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(balances).map((exchangeName) => {
              const vol = positions[
                exchangeName as unknown as keyof typeof balances
              ]?.reduce((tot, { markPrice, size }) => {
                return (tot = tot + markPrice * size);
              }, 0);

              const isShown =
                positions[exchangeName as unknown as keyof typeof balances]
                  ?.length > 0;

              const exchange: IFuture =
                balances[exchangeName as unknown as keyof typeof balances]
                  .future;

              const lev = vol / exchange.marginBalance;

              if (!isShown) {
                return null;
              }

              const liqSellPercent = nearestLiqEchange[exchangeName]?.sell
                ? percentageChange(
                    nearestLiqEchange[exchangeName]?.sell?.markPrice || 0,
                    nearestLiqEchange[exchangeName]?.sell?.liqPrice || 0
                  )
                : Number.NaN;
              const liqBuyPercent = nearestLiqEchange[exchangeName]?.buy
                ? percentageChange(
                    nearestLiqEchange[exchangeName]?.buy?.markPrice || 0,
                    nearestLiqEchange[exchangeName]?.buy?.liqPrice || 0
                  )
                : Number.NaN;
              return (
                <TableRow>
                  <TableCell
                    sx={{
                      color: lev > WARNING_LEV ? "#FFC107" : "unset",
                    }}
                  >
                    <Box display="flex">
                      <img
                        style={{
                          borderRadius: "50%",
                        }}
                        src={`/${exchangeName}.png`}
                        alt="USDT"
                        width={20}
                        height={20}
                      />
                      [x
                      {numeral(vol / exchange.marginBalance).format("0.0")}]
                    </Box>
                  </TableCell>
                  <TableCell>
                    ${numeral(exchange.marginBalance).format("0,0")}
                  </TableCell>
                  <TableCell>
                    ${numeral(exchange.marginAvailable).format("0,0")}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" justifyContent="space-between" gap={2}>
                      <Box display="flex">
                        {nearestLiqEchange[exchangeName]?.sell ? (
                          <Tooltip
                            placement="top"
                            title={
                              nearestLiqEchange[exchangeName].sell?.baseToken
                            }
                          >
                            <img
                              src={`https://assets.coincap.io/assets/icons/${nearestLiqEchange[
                                exchangeName
                              ].sell?.baseToken.toLowerCase()}@2x.png`}
                              alt={
                                nearestLiqEchange[exchangeName].sell?.baseToken
                              }
                              width={20}
                              height={20}
                            />
                          </Tooltip>
                        ) : null}
                        <Typography color="rgb(246, 70, 93)" fontSize={14}>
                          {liqSellPercent ? (
                            `${numeral(liqSellPercent).format("0,0")}%`
                          ) : (
                            <MoneyIcon />
                          )}
                        </Typography>
                      </Box>
                      <Box display="flex">
                        {nearestLiqEchange[exchangeName]?.buy ? (
                          <Tooltip
                            placement="top"
                            title={
                              nearestLiqEchange[exchangeName].buy?.baseToken
                            }
                          >
                            <img
                              src={`https://assets.coincap.io/assets/icons/${nearestLiqEchange[
                                exchangeName
                              ].buy?.baseToken.toLowerCase()}@2x.png`}
                              alt={
                                nearestLiqEchange[exchangeName].buy?.baseToken
                              }
                              width={20}
                              height={20}
                            />
                          </Tooltip>
                        ) : null}
                        <Typography color="rgb(14, 203, 129)" fontSize={14}>
                          {liqBuyPercent ? (
                            `${numeral(liqBuyPercent).format("0,0")}%`
                          ) : (
                            <MoneyIcon />
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default ExchangeMargin;
