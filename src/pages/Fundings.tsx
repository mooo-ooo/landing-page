import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { styled } from "@mui/system";
import {
  Box,
  TextField,
  Grid,
  Paper,
  TableHead,
  Table,
  TableCell,
  TableCell as TableCellMui,
  TableRow,
  TableBody,
  TableFooter,
  Alert,
  LinearProgress,
} from "@mui/material";


import api from "../lib/axios";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import LoadingButton from "@mui/lab/LoadingButton";
import numeral from "numeral";
import {
  TablePagination,
  tablePaginationClasses as classes,
} from "@mui/base/TablePagination";

const CustomTablePagination = styled(TablePagination)`
  & .${classes.toolbar} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 16px;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
    }
  }

  & .${classes.selectLabel} {
    margin: 0;
  }

  & .${classes.displayedRows} {
    margin: 0;

    @media (min-width: 768px) {
      margin-left: auto;
    }
  }

  & .${classes.spacer} {
    display: none;
  }

  & .${classes.actions} {
    display: flex;
    gap: 0.25rem;
    button {
      height: 24px;
    }
  }
  & .${classes.select} {
    height: 24px;
  }
`;

const exchanges = ["coinex", "huobi", "okx", "bybit", "gate", "bitget"];

interface IFunding {
  _id: string;
  groupId: string;
  exchange: string;
  symbol: string;
  baseToken: string;
  fundingFee: number;
  openTs: number;
  openDate: string;
}

interface IPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface SortConfig {
  key: 'openDate' | 'fundingFee' | null;
  direction: 'asc' | 'desc';
}

interface BaseTokenFundingFees {
  [token: string]: number;
}

const Fundings: FC = () => {
  const [fromDate, setFromDate] = useState<string>(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const [toDate, setToDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [exchange, setExchange] = useState<string>("");
  const [baseToken, setBaseToken] = useState<string>("");
  const [fundings, setFundings] = useState<IFunding[]>([]);
  const [totalFundingFee, setTotalFundingFee] = useState<number>(0);
  const [baseTokenFundings, setBaseTokenFundings] = useState<BaseTokenFundingFees>({});
  const [page, setPage] = useState<number>(0); // 0-based for TablePagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<IPagination>({ page: 1, limit: 10, total: 0, hasMore: false });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const lastRequestRef = useRef<string>("");

  const fetchFundings = async ({
    page = 1,
    limit = rowsPerPage,
    fromDateArg,
    toDateArg,
    exchangeArg,
    baseTokenArg,
    sortConfigArg,
  }: {
    page?: number;
    limit?: number;
    fromDateArg?: string;
    toDateArg?: string;
    exchangeArg?: string;
    baseTokenArg?: string;
    sortConfigArg?: SortConfig;
  }) => {
    setError(null);
    // Validate dates
    const fromVal = fromDateArg ?? fromDate;
    const toVal = toDateArg ?? toDate;
    if (fromVal > toVal) {
      setFundings([]);
      setPagination({ page: 1, limit, total: 0, hasMore: false });
      setError('From date cannot be after To date.');
      return;
    }
    const from = dayjs(fromVal).startOf("day").valueOf();
    const to = dayjs(toVal).endOf("day").valueOf();
    const exch = exchangeArg ?? exchange;
    const baseTok = baseTokenArg ?? baseToken;
    const sortBy = (sortConfigArg ?? sortConfig).key;
    const order = (sortConfigArg ?? sortConfig).direction;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      from: String(from),
      to: String(to),
    });
    if (exch) params.append('exchange', exch);
    if (baseTok) params.append('baseToken', baseTok);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortBy) params.append('order', order);
    const url = `/api/v1/account/funding-fees?${params.toString()}`;
    // Prevent duplicate requests
    if (lastRequestRef.current === url) return;
    lastRequestRef.current = url;
    setLoading(true);
    try {
      const { data } = await api.get(url);
      let fundingsArr: IFunding[] = [];
      let pageInfo: IPagination = { page, limit, total: 0, hasMore: false };
      if (data?.fundings && Array.isArray(data.fundings)) {
        fundingsArr = data.fundings;
        if (data.pagination) pageInfo = data.pagination;
      } else if (data?.data?.fundings && Array.isArray(data.data.fundings)) {
        fundingsArr = data.data.fundings;
        if (data.data.pagination) pageInfo = data.data.pagination;
      }

      if (data.totalFundingFees) {
        setTotalFundingFee(data.totalFundingFees);
      }

      if (data.baseTokenFundingFees && typeof data.baseTokenFundingFees === 'object') {
        setBaseTokenFundings(data.baseTokenFundingFees);
      }
      setFundings(fundingsArr);
      setPagination(pageInfo);
      setPage(page - 1); // TablePagination is 0-based, API is 1-based
    } catch (err: any) {
      setFundings([]);
      setPagination({ page: 1, limit, total: 0, hasMore: false });
      setError(err?.response?.data?.error || 'Failed to fetch data.');
    } finally {
      setLoading(false);
      lastRequestRef.current = "";
    }
  };

  // Fetch on mount and when filters, sort, or rowsPerPage change
  useEffect(() => {
    setPage(0); // Always reset to first page
    fetchFundings({
      page: 1,
      limit: rowsPerPage,
      fromDateArg: fromDate,
      toDateArg: toDate,
      exchangeArg: exchange,
      baseTokenArg: baseToken,
      sortConfigArg: sortConfig,
    });
    // eslint-disable-next-line
  }, [rowsPerPage, sortConfig]);

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
    fetchFundings({
      page: newPage + 1,
      limit: rowsPerPage,
      fromDateArg: fromDate,
      toDateArg: toDate,
      exchangeArg: exchange,
      baseTokenArg: baseToken,
      sortConfigArg: sortConfig,
    });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    fetchFundings({
      page: 1,
      limit: newLimit,
      fromDateArg: fromDate,
      toDateArg: toDate,
      exchangeArg: exchange,
      baseTokenArg: baseToken,
      sortConfigArg: sortConfig,
    });
  };

  // --- Summary Bar Logic ---
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      {/* Search/Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center" columns={12}>
          <Grid gridColumn="span 3">
            <TextField
              label="From"
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid gridColumn="span 3">
            <TextField
              label="To"
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid gridColumn="span 3">
            <FormControl fullWidth>
              <Select
                value={exchange}
                onChange={e => setExchange(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">All Exchanges</MenuItem>
                {exchanges.map(ex => (
                  <MenuItem key={ex} value={ex}>{ex}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid gridColumn="span 3">
            <Box display="flex" alignItems="center" gap={2}>
              <LoadingButton
                loading={loading}
                variant="contained"
                sx={{ minWidth: 120 }}
                onClick={() => {
                  setBaseToken("");
                  fetchFundings({
                    page: 1, baseTokenArg: "", fromDateArg: fromDate,
                    toDateArg: toDate,
                    exchangeArg: exchange,
                    sortConfigArg: sortConfig,
                  });
                }}
              >
                Sum
              </LoadingButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* --- Funding Totals Bar --- */}
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={1}>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: 3,
            bgcolor: '#847d7db9',
            color: '#fff',
            borderColor: totalFundingFee < 0 ? '#d32f2f' : '#222',
            fontWeight: 600,
            fontSize: 16,
            minWidth: 120,
            textAlign: 'center',
          }}
        >
          Funding total: {numeral(totalFundingFee).format('0,0.0000')}
        </Box>
        {Object.entries(baseTokenFundings).map(([token, total]) => (
          <Box
              key={token}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 3,
                bgcolor: '#000', // background black
                color: total > 0 ? '#2e7d32' : total < 0 ? '#d32f2f' : '#fff', // green if >0, red if <0, white otherwise
                border: '1px solid #888', // border color gray
                fontWeight: 600,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                minWidth: 80,
                textAlign: 'center',
                cursor: 'pointer', // Make it look clickable
                opacity: baseToken === token ? 0.7 : 1, // Highlight if selected
                boxShadow: baseToken === token ? '0 0 0 2px #fff' : 'none', // highlight if selected
                transition: 'all 0.15s',
              }}
            onClick={() => {
              setBaseToken(token);
              fetchFundings({
                page: 1,
                baseTokenArg: token,
                fromDateArg: fromDate,
                toDateArg: toDate,
                exchangeArg: exchange,
                sortConfigArg: sortConfig,
              });
            }}
            title={`Filter by ${token}`}
          >
            {token}: {numeral(total).format('0,0.0000')}
          </Box>
        ))}
      </Box>

      {/* Table Section */}
      <Paper sx={{ width: "100%", overflow: "hidden", mb: 2, backgroundColor: "#010409", border: "1px solid #30363d" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Table>
          <TableHead sx={{ backgroundColor: "#010409" }}>
            <TableRow sx={{ height: "48px" }}>
              <TableCellMui align="left" sx={{ cursor: 'pointer', color: '#1976d2', fontWeight: 600 }} onClick={() => setSortConfig(sc => ({ key: 'openDate', direction: sc.key === 'openDate' && sc.direction === 'asc' ? 'desc' : 'asc' }))}>
                Open Date
                {sortConfig.key === 'openDate' ? (
                  <span style={{ marginLeft: 4 }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                ) : null}
              </TableCellMui>
              <TableCellMui align="left">Exchange</TableCellMui>
              <TableCellMui align="left">Base Token</TableCellMui>
              <TableCellMui align="left" sx={{ cursor: 'pointer', color: '#1976d2', fontWeight: 600 }} onClick={() => setSortConfig(sc => ({ key: 'fundingFee', direction: sc.key === 'fundingFee' && sc.direction === 'asc' ? 'desc' : 'asc' }))}>
                Fee
                {sortConfig.key === 'fundingFee' ? (
                  <span style={{ marginLeft: 4 }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                ) : null}
              </TableCellMui>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCellMui colSpan={4}><LinearProgress color="info" /></TableCellMui>
              </TableRow>
            ) : fundings.length === 0 && !error ? (
              <TableRow>
                <TableCellMui colSpan={4} align="center">No data</TableCellMui>
              </TableRow>
            ) : (
              fundings.map(funding => {
                const color = '#0033ad';
                return (
                  <TableRow key={funding._id}>
                    <TableCellMui>{dayjs(funding.openDate).format("DD/MM/YYYY HH:mm")}</TableCellMui>
                    <TableCellMui>{funding.exchange}</TableCellMui>
                    <TableCellMui>
                      <span style={{
                        color: '#fff',
                        background: color,
                        borderRadius: 12,
                        padding: '2px 10px',
                        fontWeight: 600,
                        display: 'inline-block',
                        minWidth: 36,
                        textAlign: 'center',
                        ...(funding.fundingFee < 0 && { background: '#d32f2f' })
                      }}>{funding.baseToken}</span>
                    </TableCellMui>
                    <TableCellMui>{numeral(funding.fundingFee).format("0,0.0000")}</TableCellMui>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {/* Pagination */}
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} sx={{ border: 0 }}>
                <CustomTablePagination
                  rowsPerPageOptions={[25, 50, 100, { label: "All", value: -1 }]}
                  count={pagination.total || fundings.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  slotProps={{
                    select: {
                      "aria-label": "rows per page",
                    },
                    actions: {
                      showFirstButton: true,
                      showLastButton: true,
                    },
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  // Fix for NaN–NaN: ensure page and rowsPerPage are valid
                  // TablePagination expects 0-based page and positive rowsPerPage
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>
    </Box>
  );
}

export default Fundings;
