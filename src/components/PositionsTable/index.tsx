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
} from "@mui/material";
import type { AccordionProps } from "@mui/material";
import { styled } from "@mui/system";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import { useDispatch, useSelector } from "react-redux";
import CandleChart from "./CandleChart";
import { createPositionsTable } from "./helpers";
import type { AppDispatch } from "../../redux/store";
import type { IStrategy } from "../../redux/strategy/strategySlice";
import { selectBalances } from "../../redux/balances/balancesSlice";
import { useBalances } from "../../redux/selector";
import {
  setUpdateStrategy,
  setNewStrategy,
} from "../../redux/strategy/strategySlice";
import type { ISymbol } from "../../types";
import type { ExchangeName } from "../../types/exchange";
import sort from "lodash/orderBy";


// Store
import type { IPosition } from "../../redux/positions/positionsSlice";

export const DEFAULT_PERCENT_CHANGE_TO_SL = 35;

function Positions({
  positions,
  loadingFundingRates,
  exchanges,
  error,
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
  const balances = useSelector(selectBalances);
  const equity = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );
  const { totalVol } = useBalances();
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

  const filteredPositions = useMemo(() => {
    return positions
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
  }, [selectedExchanges, positions, searchToken]);

  const headCells = getHeadCells(filteredPositions.length);

  const sortedTableWithCells = useMemo(() => {
    const result = createPositionsTable({
    positions: filteredPositions,
    loadingFundingRates,
    equity,
    totalVol,
    openTokenDetails,
    setOpenTokenDetails,
  })
  return sort(result, result => {
    const found = result.cells.find(({ id }) => id === orderBy)
    return found?.value
  }, order)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [loadingFundingRates, filteredPositions, orderBy, order, equity, totalVol, openTokenDetails]);

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
              {sort(
                headCells.map((cell) => {
                  return {
                    ...cell,
                    order: cellsOrder[cell.id],
                  };
                }),
                ["order"]
              ).map((headCell) => (
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
              sortedTableWithCells.map(({ cells, baseToken, buys, sells }) => {
                const foundStrategy = strategies.find(
                  ({ buySymbol, sellSymbol }) => {
                    return (
                      buySymbol.includes(baseToken) &&
                      sellSymbol.includes(baseToken)
                    );
                  }
                );
                return (
                  <Fragment key={baseToken}>
                    <TableRow>
                      {sort(
                        cells.map((cell) => {
                          return {
                            ...cell,
                            order: cellsOrder[cell.id],
                          };
                        }),
                        ["order"]
                      ).map(({ component, id }) => {
                        return <TableCell key={id}>{component}</TableCell>;
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell
                        style={{
                          paddingBottom: 0,
                          paddingTop: 0,
                          // border: openTokenDetails === baseToken ? 'unset' :"none",
                          borderBottom: openTokenDetails === baseToken ? '1px solid rgba(81, 81, 81, 1)' : 'none'
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

export default Positions;

const getHeadCells = (numberOfToken: number): readonly HeadCell[] => [
  {
    id: "baseToken",
    label: `Token (${numberOfToken})`,
  },
  {
    id: "exchanges",
    label: "Exchanges",
  },

  {
    id: "volume",
    label: "Volume",
    sortable: true,
  },
  {
    id: "spreadRate",
    label: "Spread rate",
  },
  {
    id: "unrealizedPnl",
    label: "Unrealized.Pnl",
    sortable: true,
  },
  {
    id: "markPrice",
    label: "Mark Price",
    sortable: false,
  },
  {
    id: "liqPrice",
    label: "Dist. to liq",
    sortable: true,
  },

  {
    id: "fundingRate",
    label: "Funding Rate",
    sortable: true,
  },
  {
    id: "estimatedFee",
    label: "Est.Reward",
    sortable: true,
  },
  {
    id: "apr",
    label: "APR",
    sortable: true,
  },
  {
    id: "age",
    label: "Age",
    sortable: true,
  },
];

const cellsOrder: Record<string, number> = {
  baseToken: 1,
  exchanges: 2,
  volume: 3,
  spreadRate: 4,
  unrealizedPnl: 5,
  markPrice: 6,
  liqPrice: 7,
  fundingRate: 8,
  estimatedFee: 9,
  apr: 10,
  age: 11,
  actions: 12
};

type Order = "asc" | "desc";

interface HeadCell {
  id: keyof Data;
  label: string;
  sortable?: boolean;
}

interface Data extends IPosition {
  exchanges: string;
  fundingRate: number;
  estimatedFee: number;
  volume: number;
  apr: number;
  spreadRate: number;
  age: number;
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
