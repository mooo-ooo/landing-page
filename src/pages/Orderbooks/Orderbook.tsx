import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
  InputLabel,
  Stack,
  IconButton,
  Skeleton,
  Snackbar,
  Alert,
  Divider,
  Button,
} from "@mui/material";
import { red, green } from "../../constants/colors";
import { useInterval } from "usehooks-ts";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import { getExchangeFundingRate } from "../../services/funding";
import { fetchContractSize } from '../../services/contractSize'
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import numeral from "numeral";
import useResizeObserver from "use-resize-observer";
import { type Order, type OrderBook } from "./types";
import { ExchangeMap } from "./constants";
import { type Num } from "./types";

// const favExchanges = "favExchanges";
const disablesExchanges = "disablesExchanges";

// const cachedExchange = JSON.parse(localStorage.getItem(favExchanges) || "{}");
const cachedExchangeSettings: string[] = JSON.parse(
  localStorage.getItem(disablesExchanges) || "[]"
);

type MarketType = 'spot' | 'perp';

const toSymbol = (token: string, type: MarketType) => {
  if (!token) return "";
  const base = token.toUpperCase();
  return type === 'perp' ? `${base}/USDT:USDT` : `${base}/USDT`;
};

function Orderbooks({
  baseToken,
  depth = 2,
  id,
  buyExchange = 'binance',
  sellExchange = 'coinex',
  removeOrderbook,
}: {
  sellExchange?: ExchangeName;
  buyExchange?: ExchangeName;
  baseToken: string;
  depth?: number;
  id: number;
  removeOrderbook: (id: number) => void;
}) {
  const { ref, width = 1 } = useResizeObserver<HTMLDivElement>();
  const isCompact = width < 450;

  // --- 1. Draft State (UI selection only - not yet watching) ---
  const [draftBuyEx, setDraftBuyEx] = useState<ExchangeName>(buyExchange);
  const [draftSellEx, setDraftSellEx] = useState<ExchangeName>(sellExchange);
  const [draftBuyType, setDraftBuyType] = useState<MarketType>('perp');
  const [draftSellType, setDraftSellType] = useState<MarketType>('perp');

  // --- 2. Active State (What is currently being polled) ---
  const [activeBuyExName, setActiveBuyExName] = useState<ExchangeName>(buyExchange);
  const [activeSellExName, setActiveSellExName] = useState<ExchangeName>(sellExchange);
  const [activeBuySymbol, setActiveBuySymbol] = useState("");
  const [activeSellSymbol, setActiveSellSymbol] = useState("");
  
  const [buyOrderBook, setBuyOrderBook] = useState<OrderBook>();
  const [sellOrderBook, setSellOrderBook] = useState<OrderBook>();
  const [funding, setFunding] = useState({ buy: 0, sell: 0 });
  const [contractSize, setContractSize] = useState({ buy: 1, sell: 1 });
  const [error, setError] = useState<string>();

  // Derived Exchange Info
  const filteredExchanges = useMemo(() => 
    Object.keys(ExchangeMap).filter(name => !cachedExchangeSettings.includes(name)
  ), []);

  const refreshMetadata = useCallback(async (bExName: ExchangeName, sExName: ExchangeName) => {
    if (!baseToken) return;
    try {
      const [fSell, fBuy, sSell, sBuy] = await Promise.all([
        getExchangeFundingRate(sExName, baseToken),
        getExchangeFundingRate(bExName, baseToken),
        fetchContractSize(sExName, baseToken),
        fetchContractSize(bExName, baseToken),
      ]);

      setFunding({ sell: fSell.rate, buy: fBuy.rate });
      setContractSize({ sell: sSell, buy: sBuy });
    } catch (err) {
      setError(err instanceof Error ? err?.message : String(err));
    }
  }, [baseToken]);

  useEffect(() => {
    refreshMetadata(activeBuyExName, activeSellExName)
  }, [baseToken])

  // --- COMMIT ACTION ---
  const goWatch = useCallback(() => {
    const bEx = ExchangeMap[draftBuyEx];
    const sEx = ExchangeMap[draftSellEx];

    // Commit Draft to Active
    setActiveBuyExName(draftBuyEx);
    setActiveSellExName(draftSellEx);
    setActiveBuySymbol(toSymbol(baseToken, bEx?.isPerp));
    setActiveSellSymbol(toSymbol(baseToken, sEx?.isPerp));
    
    // UI Reset
    setBuyOrderBook(undefined);
    setSellOrderBook(undefined);
    refreshMetadata(draftBuyEx, draftSellEx);
  }, [baseToken, draftBuyEx, draftSellEx, refreshMetadata]);

  // Initial load and Parent prop updates
  useEffect(() => {
    setDraftBuyEx(buyExchange);
    setDraftSellEx(sellExchange);
    // Explicitly call watch to initialize active state
    goWatch();
  }, [baseToken, buyExchange, sellExchange]);

  useEffect(() => {
    setActiveBuySymbol(toSymbol(baseToken, draftBuyType));
    setActiveSellSymbol(toSymbol(baseToken, draftSellType));
  }, [draftBuyType, draftSellType, baseToken])

  // --- Polling Loop ---
  useInterval(async () => {
    const buyEx = ExchangeMap[activeBuyExName];
    const sellEx = ExchangeMap[activeSellExName];
    if (!buyEx || !sellEx || !baseToken) return;

    try {
      const [watchedBuy, watchedSell] = await Promise.all([
        buyEx.watchOrderBook(activeBuySymbol) as OrderBook,
        sellEx.watchOrderBook(activeSellSymbol) as OrderBook
      ]);

      const sliceOb = (ob: OrderBook) => ({
        ...ob,
        bids: ob.bids.slice(0, depth),
        asks: ob.asks.slice(0, depth),
      });

      // Verification to ensure we don't set data from an old symbol/token
      if (watchedBuy?.symbol === activeBuySymbol) setBuyOrderBook(sliceOb(watchedBuy));
      if (watchedSell?.symbol === activeSellSymbol) setSellOrderBook(sliceOb(watchedSell));
    } catch (err) {
      setError(err instanceof Error ? err?.message : String(err));
    }
  }, 150);

  const netFunding = useMemo(() => (funding.sell - funding.buy), [funding]);

  return (
    <Box
      ref={ref} // Attach the observer here
      display="flex"
      flexDirection="column"
      gap="12px"
    >
      <Card
        sx={{
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 1,
          background: "none",
        }}
      >
        <CardContent
          sx={{ padding: "0px", "&:last-child": { paddingBottom: 1 } }}
        >
          <Grid container spacing={isCompact ? 1 : 2}>
            <Grid p="16px" size={isCompact ? 12 : 4}>
              <Box display="flex" gap="16px" mb="16px">
                <FormControl variant="standard" sx={{ minWidth: 100 }}>
                  <InputLabel>Sell Exchange</InputLabel>
                  <Select
                    value={draftSellEx}
                    label="Sell Exchange"
                    onChange={(event: SelectChangeEvent) => {
                      setDraftSellEx(event.target.value as ExchangeName)
                    }}
                  >
                    {filteredExchanges.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box flexGrow={1} display='flex' justifyContent='flex-end'>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setDraftSellType(draftSellType === 'perp' ? 'spot' : 'perp')}
                    color='inherit'
                    sx={{
                      minWidth: '50px',
                      height: '24px',
                      fontSize: '0.65rem',
                      px: 1,
                    }}
                  >
                    {draftSellType.toUpperCase()}
                  </Button>
                </Box>
              </Box>
              {sellOrderBook ? (
                <OrderBookDisplay
                  bids={sellOrderBook.bids}
                  asks={sellOrderBook.asks}
                  contractSize={contractSize?.sell || 0}
                />
              ) : (
                <Box sx={{ width: "90%" }}>
                  <Skeleton />
                  <Skeleton animation="wave" />
                  <Skeleton animation={false} />
                </Box>
              )}
            </Grid>
            <Grid
              size={isCompact ? 12 : 4}
              sx={{
                padding: "16px",
                borderLeft: isCompact
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                borderTop: !isCompact
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <Box display="flex" gap="16px" mb="16px">
                <FormControl variant="standard" sx={{ minWidth: 100 }}>
                  <InputLabel>Buy Exchange</InputLabel>
                  <Select
                    value={draftBuyEx}
                    label="Long Exchange"
                    onChange={(event: SelectChangeEvent) => {
                      setDraftBuyEx(event.target.value as ExchangeName)
                    }}
                  >
                    {filteredExchanges.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box flexGrow={1} display='flex' justifyContent='flex-end'>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setDraftBuyType(draftBuyType === 'perp' ? 'spot' : 'perp')}
                    color='inherit'
                    sx={{
                      minWidth: '50px',
                      height: '24px',
                      fontSize: '0.65rem',
                      px: 1,
                    }}
                  >
                    {draftBuyType.toUpperCase()}
                  </Button>
                </Box>
              </Box>
              {buyOrderBook ? (
                <OrderBookDisplay
                  bids={buyOrderBook.bids}
                  asks={buyOrderBook.asks}
                  contractSize={contractSize?.buy || 0}
                />
              ) : (
                <Box sx={{ width: "90%" }}>
                  <Skeleton />
                  <Skeleton animation="wave" />
                  <Skeleton animation={false} />
                </Box>
              )}
            </Grid>
            <Grid
              size={isCompact ? 12 : 4}
              sx={{
                padding: "16px",
                borderLeft: isCompact
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                borderTop: !isCompact
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                position: "relative",
              }}
            >
              <Box>
                <Box
                  display="flex"
                  gap={1}
                  justifyContent="space-between"
                  mb={2}
                >
                  <Box
                    display="flex"
                    width="100%"
                    flexDirection="row"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Typography color="text.secondarty" variant="caption">
                      Net funding:
                    </Typography>
                    <Typography
                    
                      sx={{
                        fontWeight: 'bold',
                        color:
                          netFunding > 0
                            ? green
                            : netFunding < 0
                            ? red
                            : "inherit",
                      }}
                      variant="body1"
                    >
                      {(netFunding * 100).toFixed(3)}%
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <Box mt={2}>
                  <Grid container>
                    <Grid size={3}></Grid>
                    <Grid size={9} mb={1}>
                      <Grid container>
                        <Grid size={6}>
                          <Typography
                            variant="caption"
                            color="gray"
                            sx={{ fontWeight: "bold" }}
                          >
                            Spread
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography
                            variant="caption"
                            color="gray"
                            sx={{ fontWeight: "bold" }}
                            textAlign="right"
                            display="block"
                          >
                            Volume $
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid container mb={2}>
                    <Grid size={3}>
                      <Typography
                        variant="caption"
                        color="gray"
                        sx={{ fontWeight: "bold" }}
                      >
                        Open:
                      </Typography>
                    </Grid>
                    <Grid size={9}>
                      <SpreadRates
                        sellOrder={sellOrderBook?.bids[0]}
                        buyOrder={buyOrderBook?.asks[0]}
                        sellContractSize={contractSize?.sell}
                        buyContractSize={contractSize?.buy}
                      />
                      <SpreadRates
                        isSecondary
                        sellOrder={sellOrderBook?.bids[1]}
                        buyOrder={buyOrderBook?.asks[1]}
                        sellContractSize={contractSize?.sell}
                        buyContractSize={contractSize?.buy}
                      />
                    </Grid>
                  </Grid>
                  <Grid container>
                    <Grid size={3}>
                      <Typography
                        variant="caption"
                        color="gray"
                        sx={{ fontWeight: "bold" }}
                      >
                        Close:
                      </Typography>
                    </Grid>
                    <Grid size={9}>
                      <SpreadRates
                        sellOrder={buyOrderBook?.bids[0]}
                        buyOrder={sellOrderBook?.asks[0]}
                        sellContractSize={contractSize?.sell}
                        buyContractSize={contractSize?.buy}
                      />
                      <SpreadRates
                        isSecondary
                        sellOrder={buyOrderBook?.bids[1]}
                        buyOrder={sellOrderBook?.asks[1]}
                        sellContractSize={contractSize?.sell}
                        buyContractSize={contractSize?.buy}
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Stack
                  direction="row"
                  mt={3}
                  spacing={1}
                  justifyContent="space-between"
                >
                  <Button 
                    variant="outlined"
                    onClick={goWatch}
                    startIcon={<RotateLeftIcon />}
                  >
                    Watch
                  </Button>
                  <IconButton onClick={() => removeOrderbook(id)} color="error">
                    <IndeterminateCheckBoxIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
        <Alert severity="error" variant="filled" sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}

const SpreadRates = ({
  sellOrder,
  buyOrder,
  sellContractSize = 0,
  buyContractSize = 0,
  isSecondary = false,
}: {
  sellOrder: [Num, Num] | undefined;
  buyOrder: [Num, Num] | undefined;
  sellContractSize?: number;
  buyContractSize?: number;
  isSecondary?: boolean;
}) => {
  const spread =
    sellOrder && buyOrder
      ? calculateSpread(sellOrder[0] || 0, buyOrder[0] || 0)
      : 0;

  // Recalculate Volume: Price * (Amount * ContractSize)
  const sellVol = (sellOrder?.[0] || 0) * (sellOrder?.[1] || 0) * sellContractSize;
  const buyVol = (buyOrder?.[0] || 0) * (buyOrder?.[1] || 0) * buyContractSize;
  const minVol = Math.min(sellVol, buyVol);

  return (
    <Grid
      spacing={1}
      container
      sx={{ opacity: isSecondary ? 0.4 : 1, alignItems: "center" }}
    >
      <Grid size={6}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            fontFamily: "monospace",
            textAlign: "left",
          }}
          color={spread > 0 ? green : red}
        >
          {sellOrder && buyOrder ? numeral(spread).format("0.00") : "0.00"}%
        </Typography>
      </Grid>
      <Grid size={6}>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            textAlign: "right",
            display: "block",
          }}
        >
          {numeral(minVol).format("0,0")}
        </Typography>
      </Grid>
    </Grid>
  );
};

interface OrderRowData {
  price: number;
  amount: number;
  cost: number;
}

interface OrderBookDisplayProps {
  bids: Order[];
  asks: Order[];
}

interface OrderBookDisplayProps {
  bids: Order[];
  asks: Order[];
  isBuyExchange?: boolean;
  contractSize: number
}

const OrderBookDisplay: React.FC<OrderBookDisplayProps> = ({
  bids,
  asks,
  contractSize
}) => {
  // Simplified: No reduction/merging. Just mapping the raw data.
  const formatOrderData = (
    depths: Order[],
    shouldReverse = false
  ): OrderRowData[] => {
    const formatted = depths.map(([price = 0, amount = 0]) => ({
      price,
      amount,
      cost: price * amount * contractSize,
    }));

    return shouldReverse ? [...formatted].reverse() : formatted;
  };

  const bidBooks = formatOrderData(bids, false);
  const askBooks = formatOrderData(asks, true);

  const renderOrderRows = (
    data: OrderRowData[],
    color: string,
    keyPrefix: string
  ) => (
    <>
      {data.map(({ price, cost }) => (
        <Grid container key={`${keyPrefix}-${price}`}>
          <Grid size={6}>
            <Typography
              color={color}
              variant="body1"
              gutterBottom
              sx={{ fontFamily: "monospace" }}
            >
              {numeral(price).format("0,0.0[000000]")}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography
              variant="body1"
              gutterBottom
              sx={{ fontFamily: "monospace" }}
            >
              {numeral(cost).format("0,0")}
            </Typography>
          </Grid>
        </Grid>
      ))}
    </>
  );

  return (
    <Box>
      <Grid container sx={{ mb: 1 }}>
        <Grid size={6}>
          <Typography
            variant="caption"
            color="gray"
            sx={{ fontWeight: "bold" }}
          >
            Price
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography
            variant="caption"
            color="gray"
            sx={{ fontWeight: "bold" }}
          >
            Volume ($)
          </Typography>
        </Grid>
      </Grid>

      {/* If Buy Exchange: Bids (Green) on top, Asks (Red) on bottom */}
      {renderOrderRows(askBooks, red, "ask")}

      <Box
        py="8px"
        sx={{
          textAlign: "left",
          my: 1,
          borderY: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <Typography variant="caption" color="gray">
          Spread:{" "}
          {asks?.[0]?.[0] && bids?.[0]?.[0]
            ? numeral(((asks[0][0] - bids[0][0]) / asks[0][0]) * 100).format(
                "0.000"
              )
            : "0.000"}
          %
        </Typography>
      </Box>

      {renderOrderRows(bidBooks, green, "bid")}
    </Box>
  );
};

export default Orderbooks;

const calculateSpread = (highPrice: number, lowPrice: number) => {
  const gap = Number(highPrice) - Number(lowPrice);
  const gapPercentage = (gap / highPrice) * 100;
  return gapPercentage;
};

type ExchangeName = keyof typeof ExchangeMap;
