import { useState } from "react";
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { Group, Panel } from "react-resizable-panels";
import AddBoxIcon from "@mui/icons-material/AddBox";
import Statistic from "./Statistic";
import Orderbook from "./Orderbook";
import { useSearchParams } from "react-router-dom";
import FundingHistory, { type IStatistic } from "./FundingHistory/Container";
import { ALL_EXCHANGES, SIGNAL_EXCHANGES } from "../../constants";
import ExchangesFilter from "../Signals/ExchangesFilter";
import type { ExchangeName } from "../../types/exchange";

const firstId = new Date().getTime();
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
      <Typography component="h1" variant="h3" fontWeight="800">
        Cross-Exchange Orderbook & Funding Analysis
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Analyze real-time funding history and aggregate orderbook depth across
        multiple exchanges. Compare buy/sell liquidity for any base token to
        identify arbitrage opportunities or market trends.
      </Typography>
      <Group>
        <Panel minSize={350}>
          <Box
            sx={{ borderRight: "2px dashed rgba(255, 255, 255, 0.13)", p: 2 }}
          >
            <Box
              gap={2}
              display="flex"
              borderRadius={1}
              sx={{ border: "1px solid rgba(255, 255, 255, 0.12)", p: 2 }}
              alignItems="flex-start"
            >
              <ExchangesFilter<ExchangeName>
                options={ALL_EXCHANGES}
                value={selectedExchanges}
                onChange={(exs) => {
                  localStorage.setItem(SIGNAL_EXCHANGES, JSON.stringify(exs));
                  setSelectedExchanges(exs as ExchangeName[]);
                }}
                getOptionLabel={(o) => o}
              />
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-end"
                justifyContent="space-between"
                flexGrow={1}
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

                <Button
                  variant="outlined"
                  onClick={handleCheck}
                >
                  Check
                </Button>
              </Stack>
            </Box>
            <FundingHistory
              baseToken={activeToken}
              exchanges={selectedExchanges}
              setStatistic={setStatistic}
            />
          </Box>
        </Panel>
        <Panel minSize={350}>
          <Box sx={{ p: 2 }} display="flex" flexDirection="column" gap="12px">
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
