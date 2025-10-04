import { useMemo, useState, Fragment } from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell as TableCellMui,
  TableBody,
  Typography,
  Tooltip,
  Alert,
  AlertTitle,
  IconButton,
  Collapse,
  Button
} from "@mui/material";
import { useSnackbar } from "notistack";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MoneyIcon from "@mui/icons-material/Money";
import numeral from "numeral";
import { useSelector } from "react-redux";
import { useBalances } from "../redux/selector";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type {
  IFuture,
  ICurrencyBalance,
} from "../redux/balances/balancesSlice";
import type {
  PostitionsState,
  IPosition,
} from "../redux/positions/positionsSlice";
import { selectPositions } from "../redux/positions/positionsSlice";
import { selectGroup } from '../redux/group/groupSlice'
import { styled } from "@mui/system";
import {
  selectBalances,
  selectBalancesError,
} from "../redux/balances/balancesSlice";
import { percentageChange } from "../helpers";
import api from "../lib/axios";

const WARNING_LEV = 7.5;
function ExchangeMargin() {
  const { enqueueSnackbar } = useSnackbar();
  const error = useSelector(selectBalancesError);
  const balances = useSelector(selectBalances);
  const {exchangeLeverages} = useSelector(selectGroup);
  const positions = useSelector(selectPositions);
  const { leverage } = useBalances();
  const [selectedExchange, setSelectedExchange] = useState("");

  const handleSubmit = async (exchange: string) => {
    api
      .post("/api/v1/account/wait-for-deposit", {exchange, amount: 3})
      .then(() => {
        enqueueSnackbar(`Watching desposit (${exchange})`, { variant: "success" });
        
      })
  };

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
    <Box display="flex" flexDirection="column" gap="16px" maxHeight="400px">
      <Paper
        sx={{
          width: "100%",
          overflow: "auto",
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
              zIndex: 10,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <TableRow sx={{ height: "48px" }}>
              <TableCell align="left">
                Ex (x{numeral(leverage).format("0,0.00")})
              </TableCell>

              <TableCell align="left">Equity</TableCell>
              <TableCell align="left">Available</TableCell>
              <TableCell align="left">Liquidation</TableCell>
              <TableCell>
                <MoreVertIcon />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Alert severity="error">
                    <AlertTitle>Fetching balances error</AlertTitle>
                    {error}
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              Object.keys(balances).map((exchangeName) => {
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

                const spot: ICurrencyBalance[] =
                  balances[exchangeName as unknown as keyof typeof balances]
                    .spot;

                const lev = vol / exchange.marginBalance;

                if (!isShown) {
                  return null;
                }

                const warningLev = Number(exchangeLeverages?.[exchangeName]) || WARNING_LEV

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
                  <Fragment key={exchangeName}>
                    <TableRow
                      key={exchangeName}
                    >
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {lev > warningLev ? <WarningAmberIcon className="blinking-icon" color="warning"/> : null}
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
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          gap={2}
                        >
                          <Box display="flex">
                            {nearestLiqEchange[exchangeName]?.sell ? (
                              <Tooltip
                                placement="top"
                                title={
                                  nearestLiqEchange[exchangeName].sell
                                    ?.baseToken
                                }
                              >
                                <img
                                  src={`https://assets.coincap.io/assets/icons/${nearestLiqEchange[
                                    exchangeName
                                  ].sell?.baseToken.toLowerCase()}@2x.png`}
                                  alt={
                                    nearestLiqEchange[exchangeName].sell
                                      ?.baseToken
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
                                    nearestLiqEchange[exchangeName].buy
                                      ?.baseToken
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
                      <TableCell>
                        <IconButton
                          aria-label="expand row"
                          size="small"
                          onClick={() => {
                            if (exchangeName === selectedExchange) {
                              setSelectedExchange("");
                            } else {
                              setSelectedExchange(exchangeName);
                            }
                          }}
                        >
                          {exchangeName === selectedExchange ? (
                            <KeyboardArrowUpIcon />
                          ) : (
                            <KeyboardArrowDownIcon />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{
                          paddingBottom: 0,
                          paddingTop: 0,
                          // border: openTokenDetails === baseToken ? 'unset' :"none",
                          borderBottom:
                            exchangeName === selectedExchange
                              ? "1px solid rgba(81, 81, 81, 1)"
                              : "none",
                        }}
                        colSpan={5}
                      >
                        <Collapse
                          in={exchangeName === selectedExchange}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box>
                            <Box display='flex' justifyContent='space-between' my={1}>
                              <Typography color="textSecondary" my={1}>Spot assets</Typography>
                              <Button onClick={() => handleSubmit(exchangeName.toLowerCase())} size="small" variant="outlined" color="info">USD-M</Button>
                            </Box>
                            
                            {spot.filter(({ amount }) => amount > 0).map(({ amount, coin }) => {
                              return (
                                <Box display='flex' justifyContent='space-between' mb={1}>
                                  <Typography textTransform="uppercase">{coin}</Typography>
                                  <Typography>
                                    {numeral(amount).format("0,0")}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default ExchangeMargin;

const TableCell = styled(TableCellMui)(() => ({
  padding: "12px 16px",
}));
