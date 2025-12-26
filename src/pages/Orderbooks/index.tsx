import { useState } from "react";
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { Group, Panel, Separator } from "react-resizable-panels";
import { styled } from "@mui/material/styles";
import AddBoxIcon from "@mui/icons-material/AddBox";
import Statistic from "./Statistic";
import Orderbook from "./Orderbook";
import { useSearchParams } from "react-router-dom";
import FundingHistory, { type IStatistic } from "./FundingHistory";
import { ALL_EXCHANGES, SIGNAL_EXCHANGES } from "../../constants";
import ExchangesFilter from "../Signals/ExchangesFilter";
import type { ExchangeName } from "../../types/exchange";

const firstId = new Date().getTime();

const StyledHandle = styled(Separator)(() => ({
  width: "10px", // Total hit area
  display: "flex",
  justifyContent: "center",
  position: "relative",
  cursor: "col-resize",
  zIndex: 10,

  // The dashed line
  "&::after": {
    content: '""',
    width: "2px",
    height: "100%",
    // Creates a 4px dash and 4px gap
    backgroundImage: `linear-gradient(to bottom, 
      rgba(255, 255, 255, 0.2) 50%, 
      transparent 50%)`,
    backgroundSize: "2px 8px", // Width of 1px, repeats every 8px
    backgroundRepeat: "repeat-y",
    transition: "all 0.2s ease",
  },

  // Highlight effect on hover or drag
  "&:hover::after, &[data-resize-handle-active]::after": {
    backgroundImage: `linear-gradient(to bottom, 
      rgba(255, 255, 255, 0.7) 50%, 
      transparent 50%)`,
    width: "2px", // Make it slightly thicker when active
  },
}));

function OrderBook() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial token from URL or default to "DOGE"
  const urlToken = searchParams.get("token") || "BTC";
  // Internal input state for the TextField
  const [tokenInput, setTokenInput] = useState(urlToken);
  // State that actually triggers the FundingHistory fetch
  const [activeToken, setActiveToken] = useState(urlToken);
  const handleCheck = () => {
    setActiveToken(tokenInput.toUpperCase());
    // Update URL without refreshing the page
    setSearchParams({ token: tokenInput.toUpperCase() });
  };
  const [selectedExchanges, setSelectedExchanges] = useState<ExchangeName[]>(
    () =>
      JSON.parse(
        localStorage.getItem(SIGNAL_EXCHANGES) || JSON.stringify(ALL_EXCHANGES)
      )
  );
  const [statistic, setStatistic] = useState<IStatistic[]>([]);

  const [ids, setIds] = useState<{ id: number; disabled?: boolean }[]>([
    { id: firstId },
  ]);
  const addOrderbook = () => {
    setIds((prev) => {
      return [...prev, { id: new Date().getTime() }];
    });
  };

  const removeOrderbook = (id: number) => {
    setIds((prev) => {
      return prev.map((ob) => {
        if (id === ob.id) {
          return {
            id,
            disabled: true,
          };
        }
        return ob;
      });
    });
  };

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="32px">
      <Typography variant="h4" component="h1">
        Cross-Exchange Orderbook & Funding Analysis
      </Typography>
      <Group>
        <Panel minSize={350}>
          <Box
            sx={{ p: 2 }}
          >
            <Box
              gap={2}
              display="flex"
              borderRadius={1}
              sx={{ border: "1px solid rgba(255, 255, 255, 0.12)", p: 2 }}
              alignItems="flex-start"
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-end"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Base Token
                  </Typography>
                  <TextField
                    label=""
                    variant="outlined"
                    size="small"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                    sx={{ flexGrow: 1 }}
                  />
                </Box>

                <Button variant="outlined" onClick={handleCheck}>
                  Check
                </Button>
              </Stack>
              <Box display='flex' flexGrow={1} justifyContent='flex-end'>
                <ExchangesFilter<ExchangeName>
                options={ALL_EXCHANGES}
                value={selectedExchanges}
                onChange={(exs) => {
                  localStorage.setItem(SIGNAL_EXCHANGES, JSON.stringify(exs));
                  setSelectedExchanges(exs as ExchangeName[]);
                }}
                getOptionLabel={(o) => o}
              />
              </Box>
              
            </Box>
            <FundingHistory
              baseToken={activeToken}
              exchanges={selectedExchanges}
              setStatistic={setStatistic}
            />
          </Box>
        </Panel>
        <StyledHandle />
        <Panel minSize={350}>
          <Box sx={{ p: 2 }} display="flex" flexDirection="column" gap="16px">
            <Statistic data={statistic} />
            {ids.map(({ id, disabled }) =>
              !disabled && statistic[0] ? (
                <Orderbook
                  buyExchange={statistic[0].buyEx}
                  sellExchange={statistic[0].sellEx}
                  baseToken={activeToken}
                  key={id}
                  id={id}
                  removeOrderbook={removeOrderbook}
                />
              ) : null
            )}
            <Box display="flex" justifyContent="flex-end">
              <IconButton size="large" onClick={addOrderbook} color="info">
                <AddBoxIcon fontSize="large" />
              </IconButton>
            </Box>
          </Box>
        </Panel>
      </Group>
    </Box>
  );
}

export default OrderBook;
