import { useState, useMemo, Fragment } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell as TableCellMui,
  TableHead,
  TableRow,
  Skeleton,
  Accordion as MuiAccordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  IconButton,
  Collapse,
  Alert,
  AlertTitle,
  Tooltip,
} from "@mui/material";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import type { AccordionProps } from "@mui/material";
import { styled } from "@mui/system";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import { useDispatch } from "react-redux";
import CandleChart from "./CandleChart";
import type { AppDispatch } from "../../redux/store";
import type { IStrategy } from "../../redux/strategy/strategySlice";
import {
  setUpdateStrategy,
  setNewStrategy,
} from "../../redux/strategy/strategySlice";
import type { ISymbol } from "../../types";
import type { ExchangeName } from "../../types/exchange";

// Services
import numeral from "numeral";

// Store
import type { IPosition } from "../../redux/positions/positionsSlice";
import { percentageChange, strip } from "../../helpers";

export const DEFAULT_PERCENT_CHANGE_TO_SL = 35;

function Positions({
  positions,
  loadingFundingRates,
  exchanges,
  error,
  // symbols,
  strategies,
}: {
  strategies: IStrategy[];
  symbols: ISymbol[];
  error: string | null;
  exchanges: string[];
  loadingFundingRates: boolean;
  positions: {
    buys: IPosition[];
    sells: IPosition[];
    baseToken: string;
  }[];
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [searchToken, setSearchToken] = useState("");
  const [openTokenDetails, setOpenTokenDetails] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const localOrderBy = localStorage.getItem("orderBy") || "volume";
  const localOrder = localStorage.getItem("order") || "desc";
  const [order, setOrder] = useState<Order>(localOrder as Order);
  const [orderBy, setOrderBy] = useState<keyof Data>(
    localOrderBy as keyof Data
  );

  const createSortHandler = (property: keyof Data) => () => {
    const isAsc = orderBy === property && order === "asc";
    localStorage.setItem("orderBy", property);
    localStorage.setItem("order", isAsc ? "desc" : "asc");
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property as keyof IPosition);
  };

  const handleSelectExchange = (exchange: string) => {
    const isIncluded = selectedExchanges.includes(exchange);
    if (!isIncluded) {
      setSelectedExchanges([...selectedExchanges, exchange]);
    } else {
      setSelectedExchanges(selectedExchanges.filter((ex) => ex !== exchange));
    }
  };

  const visibleRows = useMemo(
    () => [...positions].sort(getComparator(order, orderBy)),
    [order, orderBy, positions]
  );

  const filteredPositions = useMemo(() => {
    return visibleRows
      .filter(({ buys, sells }) => {
        if (!selectedExchanges?.length) {
          return true;
        }
        const intersection = [...buys, ...sells]
          .map((ex) => ex.exchange)
          .filter((element) => selectedExchanges.includes(element));
        return intersection.length > 0;
      })
      .filter(({ baseToken }) => {
        if (!searchToken) {
          return true;
        }
        return searchToken.toLowerCase().includes(baseToken.toLowerCase());
      });
  }, [selectedExchanges, visibleRows, searchToken]);

  const headCells = getHeadCells(filteredPositions.length);
  return (
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
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Box
              display="flex"
              justifyContent="space-between"
              width="100%"
              alignItems="center"
            >
              <Box display="flex" width="100%" alignItems="center">
                <FilterListIcon />
                <Typography ml={1} component="span">
                  My positions
                </Typography>
              </Box>
              <Box
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                }}
              >
                <TextField
                  size="small"
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1}>
              {exchanges.map((exchange) => (
                <Chip
                  key={exchange}
                  label={exchange}
                  variant={
                    !selectedExchanges.includes(exchange)
                      ? "outlined"
                      : "filled"
                  }
                  onClick={() => handleSelectExchange(exchange)}
                />
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Table>
          <TableHead
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <TableRow sx={{ height: "56px" }}>
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
                    <Typography color="textSecondary">
                      {headCell.label}
                    </Typography>
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
              <TableCell>
                <MoreVertIcon />
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={headCells.length + 1}>
                  <Alert severity="error">
                    <AlertTitle>Fetching positions error</AlertTitle>
                    {error}
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              filteredPositions.map(({ sells, buys, baseToken }) => {
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
                const totalSizeBuy = buys.reduce(
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

                // const coinId = symbols.find(
                //   ({ symbol }) => symbol === baseToken
                // )?.id;

                const sellCreatedAts = sells.map(({ createdAt }) => createdAt)
                const buyCreatedAts = buys.map(({ createdAt }) => createdAt)

                const createdAt = Math.min(...[...sellCreatedAts, ...buyCreatedAts])

                const foundStrategy = strategies.find(
                  ({ buySymbol, sellSymbol }) => {
                    return (
                      buySymbol.includes(baseToken) &&
                      sellSymbol.includes(baseToken)
                    );
                  }
                );

                const distToLiqBuy = Math.max(
                  100 -
                    Math.abs(
                      percentageChange(buys[0].markPrice, buys[0].liqPrice || 0)
                    ),
                  0
                );
                const distToLiqSell = Math.max(
                  100 -
                    Math.abs(
                      percentageChange(
                        sells[0].markPrice,
                        sells[0].liqPrice || 0
                      )
                    ),
                  0
                );

                const spreadSize = Math.abs(
                  strip(String(totalSizeSell)) - strip(String(totalSizeBuy))
                );
                return (
                  <Fragment key={baseToken}>
                    <TableRow>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <img
                            src={`https://assets.coincap.io/assets/icons/${baseToken.toLowerCase()}@2x.png`}
                            alt={baseToken}
                            width={20}
                            height={20}
                          />
                          <Typography>{baseToken}</Typography>
                          {spreadSize ? (
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
                              <Typography color="rgb(246, 70, 93)">{numeral(spreadSize * sells[0].markPrice).format("0,0")}</Typography>
                            </IconButton>
                          ) : null}
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
                        {sells.length ? (
                          <Typography>
                            {numeral(
                              sells[0].markPrice * totalSizeSell * 2
                            ).format("0,0]")}
                          </Typography>
                        ) : (
                          <Skeleton animation="wave" />
                        )}
                      </TableCell>
                      <TableCell align="left">
                        {sells.length && buys.length ? (
                          <Typography>
                            {numeral(
                              percentageChange(
                                buys[0]?.avgPrice,
                                sells[0]?.avgPrice
                              )
                            ).format("0.[000]")}
                            %
                          </Typography>
                        ) : (
                          <Skeleton animation="wave" />
                        )}
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
                          {sells.length ? (
                            numeral(sells[0].markPrice).format(
                              precisionMap[baseToken] || "0,0.[000]"
                            )
                          ) : (
                            <Skeleton animation="wave" />
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
                          <Box
                            display="flex"
                            gap={1}
                            alignItems="space-between"
                          >
                            {/* <ArrowUpwardIcon
                              sx={{ color: "rgb(14 203 129 / 40%)" }}
                            /> */}
                            {sells.length ? (
                              <Box>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Typography fontSize="10px">
                                    {numeral(distToLiqSell).format("0,0")}%
                                  </Typography>
                                  <Typography fontSize="10px">
                                    {numeral(sells[0].liqPrice).format(
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
                          <Box
                            display="flex"
                            gap={1}
                            alignItems="space-between"
                          >
                            {/* <ArrowDownwardIcon
                              sx={{ color: "rgb(246 70 93 / 40%)" }}
                            /> */}
                            {buys.length ? (
                              <Box>
                                <Box
                                  display="flex"
                                  justifyContent="space-between"
                                >
                                  <Typography fontSize="10px">
                                    {numeral(distToLiqBuy).format("0,0")}%
                                  </Typography>
                                  <Typography fontSize="10px">
                                    {numeral(buys[0].liqPrice).format(
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
                      </TableCell>

                      <TableCell align="left">
                        {loadingFundingRates ||
                        !sells.length ||
                        !buys.length ? (
                          <Skeleton animation="wave" />
                        ) : (
                          <Box>
                            <Tooltip
                              placement="top-start"
                              title={`${numeral(
                                100 * sells[0].fundingRate
                              ).format("0,0.[000]")} - ${numeral(
                                100 * buys[0].fundingRate
                              ).format("0,0.[000]")}`}
                            >
                              <Typography>
                                {numeral(
                                  100 *
                                    (sells[0].fundingRate - buys[0].fundingRate)
                                ).format("0,0.[000]")}
                                %
                              </Typography>
                            </Tooltip>
                          </Box>
                        )}
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
                        {loadingFundingRates ||
                        !sells.length ||
                        !buys.length ? (
                          <Skeleton animation="wave" />
                        ) : (
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
                        )}
                      </TableCell>
                      <TableCell align="left">
                        {calculateDaysBack(createdAt)} days
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{
                          paddingBottom: 0,
                          paddingTop: 0,
                          border: "none",
                        }}
                        colSpan={headCells.length + 1}
                      >
                        <Collapse
                          in={openTokenDetails === baseToken}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ margin: 1 }}>
                            <IconButton
                              onClick={() =>
                                foundStrategy
                                  ? dispatch(
                                      setUpdateStrategy({
                                        open: true,
                                        baseToken,
                                      })
                                    )
                                  : dispatch(
                                      setNewStrategy({ open: true, baseToken })
                                    )
                              }
                            >
                              <ViewQuiltIcon />
                            </IconButton>
                          </Box>
                          <Box sx={{ margin: 1 }}>
                            <CandleChart
                              baseToken={baseToken}
                              sellExchanges={sells.map(
                                (sell) => sell.exchange as ExchangeName
                              )}
                              buyExchanges={buys.map(
                                (buy) => buy.exchange as ExchangeName
                              )}
                            />
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
    label: "Spread rate",
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
    label: "Dist. to liq",
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
  {
    id: "age",
    numeric: false,
    disablePadding: false,
    label: "Age",
    sortable: false,
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
    if (
      !a.sells.length ||
      !a.buys.length ||
      !b.sells.length ||
      !b.buys.length
    ) {
      return 0;
    }
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
  age: number
}

const TableCell = styled(TableCellMui)(() => ({
  padding: "6px 16px",
}));

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

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

function calculateDaysBack(timestamp: number | string): number {
  // Ensure the timestamp is a number.
  const inputTimestampMs = typeof timestamp === 'string' ? Number(timestamp) : timestamp;

  // Check for invalid input.
  if (isNaN(inputTimestampMs) || inputTimestampMs <= 0) {
    console.error("Invalid timestamp provided.");
    return 0;
  }

  const now = Date.now();
  const oneDayInMs = 1000 * 60 * 60 * 24;

  // Calculate the difference in milliseconds.
  const timeDifferenceMs = now - inputTimestampMs;

  // If the timestamp is in the future, return 0.
  if (timeDifferenceMs < 0) {
    return 0;
  }

  // Convert the difference to days and round down to the nearest whole number.
  const daysBack = Math.floor(timeDifferenceMs / oneDayInMs);

  return daysBack;
}