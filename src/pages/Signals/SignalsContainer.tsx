import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell as TableCellMui,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Tooltip,
  Stack,
  Chip,
  Divider,
  Button,
  Select,
  TextField,
  IconButton,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from "@mui/icons-material/Edit";
import readableNumber from "human-readable-numbers";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { styled } from "@mui/system";
import PercentIcon from "@mui/icons-material/Percent";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import ExchangesFilter from "./ExchangesFilter";
import { green, red } from "../../constants/colors";
import CloseIcon from "@mui/icons-material/Close";
import Spread from "./Spread";
import {
  type ArbitrageOpportunity,
  type WorkerInput,
  type WorkerOutput,
} from "../../workers/funding.worker";
import CountdownTimer from "./CountdownTime";
import MyArbitrageWorker from "../../workers/funding.worker.ts?worker";
import { type ExchangeName } from "../../types/exchange";

// Constants & Types
const SIGNAL_EXCHANGES = "SIGNAL_EXCHANGES";
const SIGNAL_WEEKS = "SIGNAL_WEEKS";

const EXCHANGES: ExchangeName[] = [
  "okx",
  "gate",
  "bitget",
  "huobi",
  "bybit",
  "coinex",
];
const FILTER_OPTIONS = [
  { id: "token", label: "Token Name" }, // New option
  { id: "currentApr", label: "Current APR" },
  { id: "vol24h", label: "24h Volume" },
  { id: "OI", label: "Open Interest" },
  { id: "AccumulatedApr", label: "Accumulated APR" },
];

type SortKey = "baseToken" | "vol24h" | "currentApr" | "cumulativeAPR";
type SortOrder = "asc" | "desc";

const XAPY_SUGGEST = [
  "BTC",
  "ETH",
  "DOGE",
  "SOL",
  "BNB",
  "LINK",
  "XRP",
  "AVAX",
  "ETC",
  "PEPE",
  "ADA",
  "UNI",
  "SHIB",
  "HYPE",
  "SUI",
  "LTC",
  "TRX",
  "ENA",
  "AAVE",
  "XAUT",
  "TON",
  "DOT",
  "FIL",
  "ARB",
];

const MY_FAV_KEY = "SIGNAL_MY_FAV_TOKENS";

const SignalsContainer: React.FC = () => {
  const [sortKey, setSortKey] = useState<SortKey>("cumulativeAPR");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  // 1. Manage the two lists
  const [activeTab, setActiveTab] = useState<"suggest" | "fav">("suggest");
  const [myFavTokens, setMyFavTokens] = useState<string[]>(() => {
    const saved = localStorage.getItem(MY_FAV_KEY);
    return saved ? JSON.parse(saved) : ["BTC", "ETH", "SOL"];
  });

  const navigate = useNavigate();

  const handleNavigation = (token: string) => {
    navigate(`/orderbooks?token=${token}`);
  };

  // 2. Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [tempTokens, setTempTokens] = useState("");

  // 3. Determine which tokens to send to worker
  const activeTokens = useMemo(
    () => (activeTab === "suggest" ? XAPY_SUGGEST : myFavTokens),
    [activeTab, myFavTokens]
  );

  const handleOpenEdit = () => {
    setTempTokens(myFavTokens.join(", "));
    setIsEditDialogOpen(true);
  };

  const handleSaveFavs = () => {
    const cleaned = tempTokens
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s !== "");
    setMyFavTokens(cleaned);
    localStorage.setItem(MY_FAV_KEY, JSON.stringify(cleaned));
    setIsEditDialogOpen(false);
  };
  // State Initialization from LocalStorage
  const [weeks, setWeeks] = useState(
    () => Number(localStorage.getItem(SIGNAL_WEEKS)) || 2
  );
  const [selectedExchanges, setSelectedExchanges] = useState<ExchangeName[]>(
    () =>
      JSON.parse(
        localStorage.getItem(SIGNAL_EXCHANGES) || JSON.stringify(EXCHANGES)
      )
  );

  const handleSort = (key: SortKey) => {
    const isAsc = sortKey === key && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortKey(key);
  };

  const [filters, setFilters] = useState([
    { field: FILTER_OPTIONS[0].id, operator: ">", value: "" },
  ]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<
    ArbitrageOpportunity[]
  >([]);

  const filteredOpportunities = useMemo(() => {
    const filtered = arbitrageOpportunities.filter((opp) => {
      // Every filter condition must be met (AND logic)
      return filters.every((filter) => {
        // If no value is entered, don't apply this specific filter
        if (!filter.value || filter.value === "") return true;

        const threshold = parseFloat(filter.value);
        const operator = filter.operator;

        switch (filter.field) {
          case "token": {
            // Case-insensitive search for token string
            return opp.baseToken
              .toUpperCase()
              .includes(filter.value.toUpperCase());
          }
          case "vol24h": {
            // Both sides must meet the volume requirement for the signal to be valid
            const isBuyOk =
              operator === ">"
                ? opp.buyVol24h > threshold
                : opp.buyVol24h < threshold;
            const isSellOk =
              operator === ">"
                ? opp.sellVol24h > threshold
                : opp.sellVol24h < threshold;
            return isBuyOk && isSellOk;
          }

          case "currentApr": {
            const interval = 3;
            const currentApr =
              ((opp.sellExchangeRate - opp.buyExchangeRate) / 2) *
              interval *
              365 *
              100;
            return operator === ">"
              ? currentApr > threshold
              : currentApr < threshold;
          }

          case "AccumulatedApr": {
            // Using the projected APR from historical data
            const actualApr = opp.cumulativeAPR / 2;
            return operator === ">"
              ? actualApr > threshold
              : actualApr < threshold;
          }

          case "OI": {
            // If you add Open Interest to your worker later, handle it here
            return true;
          }

          default:
            return true;
        }
      });
    });
    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortKey) {
        case "vol24h":
          // Sort by the average volume of both exchanges
          aVal = (a.buyVol24h + a.sellVol24h) / 2;
          bVal = (b.buyVol24h + b.sellVol24h) / 2;
          break;
        case "currentApr":
          aVal = (a.sellExchangeRate - a.buyExchangeRate) / 2;
          bVal = (b.sellExchangeRate - b.buyExchangeRate) / 2;
          break;
        case "cumulativeAPR":
          aVal = a.cumulativeAPR;
          bVal = b.cumulativeAPR;
          break;
        case "baseToken":
          aVal = a.baseToken;
          bVal = b.baseToken;
          break;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [arbitrageOpportunities, filters, sortKey, sortOrder]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Filter Logic ---

  const availableFields = useMemo(() => {
    const selectedFields = filters.map((f) => f.field);
    return FILTER_OPTIONS.filter((opt) => !selectedFields.includes(opt.id));
  }, [filters]);

  const addFilter = () => {
    if (availableFields.length > 0) {
      setFilters([
        ...filters,
        { field: availableFields[0].id, operator: ">", value: "" },
      ]);
    }
  };

  const removeFilter = (index: number) => {
    if (filters.length > 1) {
      setFilters(filters.filter((_, i) => i !== index));
    }
  };

  const updateFilter = (index: number, key: string, val: string) => {
    setFilters(filters.map((f, i) => (i === index ? { ...f, [key]: val } : f)));
  };

  function handleWeekChange(
    _: React.MouseEvent<HTMLElement>,
    newWeek: number | null
  ) {
    if (newWeek !== null) {
      setWeeks(newWeek);
      localStorage.setItem(SIGNAL_WEEKS, newWeek.toString());
    }
  }

  // --- Worker Effect ---
  useEffect(() => {
    setLoading(true);
    const worker = new MyArbitrageWorker();
    worker.postMessage({
      type: "PROCESS_MARKET",
      tokens: activeTokens, // truncated for brevity
      exchanges: selectedExchanges,
      weeks,
    } as WorkerInput);

    worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
      if (e.data.status === "success")
        setArbitrageOpportunities(e.data.data as ArbitrageOpportunity[]);
      else setError(e.data.errorMessage || "Failed to fetch data");
      setLoading(false);
      worker.terminate();
    };

    return () => worker.terminate();
  }, [selectedExchanges, weeks, activeTokens]);

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="32px">
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          icon={<AutoGraphIcon />}
          label="Live Analysis"
          color="primary"
          size="small"
          variant="outlined"
        />
      </Stack>

      <Typography component="h1" variant="h3" fontWeight="800">
        Crypto Funding Arbitrage
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "background.paper",
          borderStyle: "dashed",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Data Query Filters
          </Typography>

          {/* Weeks Selector */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Lookback:
            </Typography>
            <ToggleButtonGroup
              value={weeks}
              exclusive
              onChange={handleWeekChange}
              size="small"
              color="standard"
            >
              <ToggleButton value={1} sx={{ px: 2 }}>
                1W
              </ToggleButton>
              <ToggleButton value={2} sx={{ px: 2 }}>
                2W
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box display="flex" gap={4}>
          <Box sx={{ minWidth: 280 }}>
            <ExchangesFilter<ExchangeName>
              options={EXCHANGES}
              value={selectedExchanges}
              onChange={(exs) => {
                localStorage.setItem(SIGNAL_EXCHANGES, JSON.stringify(exs));
                setSelectedExchanges(exs as ExchangeName[]);
              }}
              getOptionLabel={(o) => o}
            />
          </Box>

          <Stack flexGrow={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Specify exact numeric values for each parameter.
            </Typography>
            {filters.map((filter, index) => (
              <Stack
                key={index}
                direction="row"
                spacing={1.5}
                alignItems="center"
              >
                <Select
                  size="small"
                  value={filter.field}
                  onChange={(e) => updateFilter(index, "field", e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  {FILTER_OPTIONS.map((opt) => (
                    <MenuItem
                      key={opt.id}
                      value={opt.id}
                      disabled={filters.some(
                        (f, i) => f.field === opt.id && i !== index
                      )}
                    >
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>

                <Select
                  size="small"
                  value={filter.field === "token" ? "=" : filter.operator} // Force "=" for token
                  disabled={filter.field === "token"} // Lock it for token
                  onChange={(e) =>
                    updateFilter(index, "operator", e.target.value)
                  }
                >
                  <MenuItem value=">">&gt;</MenuItem>
                  <MenuItem value="<">&lt;</MenuItem>
                  <MenuItem value="=">=</MenuItem>
                </Select>

                <TextField
                  size="small"
                  type={filter.field === "token" ? "text" : "number"} // Change input type
                  placeholder={filter.field === "token" ? "e.g. BTC" : "Value"}
                  value={filter.value}
                  onChange={(e) => updateFilter(index, "value", e.target.value)}
                />

                <IconButton
                  color="error"
                  onClick={() => removeFilter(index)}
                  disabled={filters.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={addFilter}
              disabled={availableFields.length === 0}
              sx={{ alignSelf: "flex-start" }}
            >
              Add Condition
            </Button>
          </Stack>

          <Box sx={{ minWidth: 300 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Signal Source
            </Typography>
            <ToggleButtonGroup
              value={activeTab}
              exclusive
              size="small"
              onChange={(_, val) => val && setActiveTab(val)}
              fullWidth
              color="primary"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="suggest">Xapy Suggest</ToggleButton>
              <ToggleButton value="fav">My Favourite</ToggleButton>
            </ToggleButtonGroup>

            {activeTab === "fav" ? (
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Current: ** {myFavTokens.length} ** tokens
                  </Typography>

                  {/* Smaller, subtle Edit Icon Button */}
                  <Tooltip title="Customized list stored locally.">
                    <IconButton
                      size="small"
                      onClick={handleOpenEdit}
                      sx={{
                        color: "primary.main",
                        padding: "4px",
                        "&:hover": { bgcolor: "rgba(25, 118, 210, 0.08)" },
                      }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ height: 52, display: "flex", alignItems: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Using high-volatility tokens from Xapy.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
      <Box height={12} />
      {/* Table logic remains similar... */}
      {error ? (
        <Alert
          severity="error"
          variant="filled"
          action={
            <IconButton aria-label="close" color="inherit" size="small">
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            width: "100%",
            boxShadow: (theme) => theme.shadows[6],
            borderRadius: 2,
          }}
        >
          <AlertTitle sx={{ fontWeight: 800 }}>Data Fetching Error</AlertTitle>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      ) : null}
      {loading ? (
        <CircularProgress sx={{ m: 5 }} />
      ) : (
        <TableContainer sx={{ border: "1px solid rgba(255, 255, 255, 0.12)" }}>
          <Table>
            <TableHead sx={{ height: "48px" }}>
              <TableRow>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Token
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Exchanges
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortKey === "vol24h"}
                    direction={sortKey === "vol24h" ? sortOrder : "asc"}
                    onClick={() => handleSort("vol24h")}
                  >
                    24h Volume
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Funding Time
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Spread (%)
                </TableCell>
                <TableCell
                  align="left"
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  <TableSortLabel
                    active={sortKey === "currentApr"}
                    direction={sortKey === "currentApr" ? sortOrder : "asc"}
                    onClick={() => handleSort("currentApr")}
                  >
                    Current APR
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 0.5,
                    }}
                  >
                    <TableSortLabel
                      active={sortKey === "cumulativeAPR"}
                      direction={
                        sortKey === "cumulativeAPR" ? sortOrder : "asc"
                      }
                      onClick={() => handleSort("cumulativeAPR")}
                    >
                      APR last {weeks} week(s)
                    </TableSortLabel>
                    <Tooltip title="Annual Percentage Rate projected from historical data">
                      <PercentIcon sx={{ fontSize: 16 }} />
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOpportunities.map((opp) => {
                const interval = 3;
                const fundingAPR =
                  ((opp.sellExchangeRate - opp.buyExchangeRate) / 2) *
                  interval *
                  365 *
                  100;
                return (
                  <TableRow key={opp.baseToken}>
                    <TableCell
                      onClick={() => handleNavigation(opp.baseToken)}
                      style={{ cursor: "pointer", fontWeight: "bold", textDecoration: 'underline', fontStyle: 'italic' }}
                    >
                      <Box gap={2} display='flex' alignItems='center'>{opp.baseToken}
                      <OpenInNewIcon /></Box>
                      
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "left",
                          flexDirection: "column",
                        }}
                      >
                        <Typography color={red} align="left">
                          {opp.sellExchange.toUpperCase()}
                        </Typography>
                        <Typography color={green} align="left">
                          {opp.buyExchange.toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {/* Volume for the Sell Side */}
                        <Typography align="left">
                          {readableNumber.toHumanString(opp.sellVol24h)}
                        </Typography>

                        {/* Volume for the Buy Side */}
                        <Typography align="left">
                          {readableNumber.toHumanString(opp.buyVol24h)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={2}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {/* Countdown for the Sell Exchange */}
                          <Box display="flex" alignItems="center" gap={1}>
                            <CountdownTimer
                              targetTime={opp.nextFundingTime.sell}
                            />
                          </Box>

                          {/* Countdown for the Buy Exchange */}
                          <Box display="flex" alignItems="center" gap={1}>
                            <CountdownTimer
                              targetTime={opp.nextFundingTime.buy}
                            />
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          {/* Volume for the Sell Side */}
                          <Typography align="left" variant="caption">
                            {(opp.sellExchangeRate * 100).toFixed(2)}%
                          </Typography>

                          {/* Volume for the Buy Side */}
                          <Typography align="left" variant="caption">
                            {(opp.buyExchangeRate * 100).toFixed(2)}%
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell align="left">
                      <Spread
                        symbol={opp.baseToken}
                        buyExchange={opp.buyExchange as ExchangeName}
                        sellExchange={opp.sellExchange as ExchangeName}
                      />
                    </TableCell>
                    <TableCell align="left">
                      <Typography
                        sx={{ fontWeight: "800" }}
                        color={fundingAPR > 0 ? green : red}
                      >
                        {fundingAPR.toFixed(2)}%
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography
                        color="success.main"
                        sx={{ fontWeight: "800" }}
                      >
                        {(opp.cumulativeAPR / 2).toFixed(2)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOpportunities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No arbitrage opportunities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit My Favorites</DialogTitle>
        <DialogContent>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Enter token symbols separated by commas (e.g., BTC, ETH, SOL)
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={6}
            fullWidth
            variant="filled"
            value={tempTokens}
            onChange={(e) => setTempTokens(e.target.value)}
            placeholder="COAI, TURBO, ACT..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsEditDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveFavs} variant="contained" disableElevation>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const TableCell = styled(TableCellMui)({ padding: "8px 16px" });

export default SignalsContainer;
