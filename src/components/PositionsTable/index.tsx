import { useState, useMemo } from "react";
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
} from "@mui/material";
import type { AccordionProps } from "@mui/material";
import { styled } from "@mui/system";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";

// Services
import numeral from "numeral";

// Store
import type { IPosition } from "../../redux/positions/positionsSlice";
import { percentageChange } from "../../helpers";

export const DEFAULT_PERCENT_CHANGE_TO_SL = 35;

function Positions({
  positions,
  loadingFundingRates,
  exchanges,
}: {
  exchanges: string[];
  loadingFundingRates: boolean;
  positions: {
    buys: IPosition[];
    sells: IPosition[];
    baseToken: string;
  }[];
}) {
  const [searchToken, setSearchToken] = useState("");
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
            {filteredPositions.map(({ sells, buys, baseToken }) => {
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
                        percentageChange(buys[0]?.avgPrice, sells[0]?.avgPrice)
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
                    {loadingFundingRates ? (
                      <Skeleton animation="wave" />
                    ) : (
                      <Typography>
                        {numeral(
                          100 * (sells[0].fundingRate - buys[0].fundingRate)
                        ).format("0,0.[00]")}
                        %
                      </Typography>
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
                    {loadingFundingRates ? (
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
                </TableRow>
              );
            })}
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
