import { useState, useEffect } from "react";
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
  Button,
  Divider,
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
import { ExchangeMap, type Exchange } from "./constants";
import { type Num } from "./types";

// const favExchanges = "favExchanges";
const disablesExchanges = "disablesExchanges";

// const cachedExchange = JSON.parse(localStorage.getItem(favExchanges) || "{}");
const cachedExchangeSettings: string[] = JSON.parse(
  localStorage.getItem(disablesExchanges) || "[]"
);

const toPerpSymbol = (baseToken: string) =>
  `${baseToken}/USDT:USDT`.toUpperCase();

function Orderbooks({
  baseToken,
  depth = 2,
  id,
  buyExchange,
  sellExchange,
  removeOrderbook,
}: {
  sellExchange?: ExchangeName;
  buyExchange?: ExchangeName;
  baseToken: string;
  depth?: number;
  id: number;
  removeOrderbook: (id: number) => void;
}) {
  // Use the hook to measure the current width of the component's container
  const { ref, width = 1 } = useResizeObserver<HTMLDivElement>();

  // Define "Mobile" logic based on the component's own width (e.g., < 600px)
  const isCompact = width < 450;
  const [error, setError] = useState<string>();

  const [longOrderBook, setLongOrderBook] = useState<OrderBook>();
  const [shortOrderBook, setShortOrderBook] = useState<OrderBook>();
  const [funding, setFunding] = useState<{ buy: number; sell: number }>();
  const [contractSize, setContractSize] = useState<{ buy: number; sell: number }>();

  const [buySymbol, setBuySymbol] = useState<string>(toPerpSymbol(baseToken));
  const [sellSymbol, setSellSymbol] = useState<string>(toPerpSymbol(baseToken));
  // console.log({buySymbol, sellSymbol})
  const [longEx, setLongEx] = useState<Exchange>(buyExchange);
  const [shortEx, setShortEx] = useState<Exchange>(sellExchange);

  const [longExName, setLongExName] = useState<ExchangeName>(
    buyExchange || "okx"
  );
  const [shortExName, setShortExName] = useState<ExchangeName>(
    sellExchange || "bybit"
  );

  const fetchFunding = async () => {
    const res = await Promise.all([
      getExchangeFundingRate(sellExchange as ExchangeName, baseToken),
      getExchangeFundingRate(buyExchange as ExchangeName, baseToken),
    ]);
    setFunding({
      sell: res[0].rate,
      buy: res[1].rate,
    });
  };

  const fetchContractSizes = async () => {
    const res = await Promise.all([
      fetchContractSize(sellExchange as ExchangeName, baseToken),
      fetchContractSize(buyExchange as ExchangeName, baseToken),
    ]);
    setContractSize({
      sell: res[0],
      buy: res[1],
    });
  };

  useEffect(() => {
    setShortExName(sellExchange as Exchange);
    setLongExName(buyExchange as Exchange);
    fetchFunding();
    fetchContractSizes()
  }, [sellExchange, buyExchange]);

  const [setting, setSetting] = useState({
    buySymbol,
    sellSymbol,
    longExName,
    shortExName,
  });

  useEffect(() => {
    if (baseToken.length) {
      const symbol = `${baseToken}/USDT:USDT`;
      setSetting((prev) => {
        return {
          ...prev,
          buySymbol: symbol,
          sellSymbol: symbol,
        };
      });
    }
  }, [baseToken]);

  useEffect(() => {
    setShortEx(ExchangeMap[shortExName]);
    setLongEx(ExchangeMap[longExName]);
  }, [shortExName, longExName]);

  useInterval(
    async () => {
      const watchedLongOrderbook = await longEx!
        .watchOrderBook(`${buySymbol}`)
        .catch((err: Error) => setError(err?.message));
      const watchedShortOrderbook = await shortEx!
        .watchOrderBook(`${sellSymbol}`)
        .catch((err: Error) => setError(err?.message));

      const slicedOrderbook = (ob: OrderBook): OrderBook => {
        return {
          ...ob,
          bids: ob.bids.slice(0, depth),
          asks: ob.asks.slice(0, depth),
        };
      };
      if (watchedLongOrderbook?.symbol === buySymbol) {
        setLongOrderBook((prev) => {
          return {
            ...prev,
            ...slicedOrderbook(watchedLongOrderbook),
          };
        });
      }

      if (watchedShortOrderbook?.symbol === sellSymbol) {
        setShortOrderBook((prev) => {
          return {
            ...prev,
            ...slicedOrderbook(watchedShortOrderbook),
          };
        });
      }
    },
    // Delay in milliseconds or null to stop it
    200
  );

  useEffect(() => {
    fetchFunding();
    fetchContractSizes();
    setSellSymbol(toPerpSymbol(baseToken));
    setBuySymbol(toPerpSymbol(baseToken));
  }, [baseToken]);

  const goWatch = () => {
    setShortExName(setting.shortExName);
    setLongExName(setting.longExName);
    setSellSymbol(setting.sellSymbol);
    setBuySymbol(setting.buySymbol);
    setShortOrderBook(undefined);
    setLongOrderBook(undefined);
  };

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setError(undefined);
  };

  const filteredExchanges = Object.keys(ExchangeMap).filter(
    (name) => !cachedExchangeSettings.includes(name)
  );

  const netFunding =
    funding?.sell && funding?.buy ? funding?.sell - funding?.buy : 0;

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
                    value={setting.shortExName}
                    label="Short Exchange"
                    onChange={(event: SelectChangeEvent) => {
                      setSetting((prev) => {
                        return {
                          ...prev,
                          shortExName: event.target.value as ExchangeName,
                        };
                      });
                    }}
                  >
                    {filteredExchanges.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box flexGrow={1}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="right"
                  >
                    {sellSymbol}
                  </Typography>
                </Box>
              </Box>
              {shortOrderBook ? (
                <OrderBookDisplay
                  bids={shortOrderBook.bids}
                  asks={shortOrderBook.asks}
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
              }}
            >
              <Box display="flex" gap="16px" mb="16px">
                <FormControl variant="standard" sx={{ minWidth: 100 }}>
                  <InputLabel>Buy Exchange</InputLabel>
                  <Select
                    value={setting.longExName}
                    label="Long Exchange"
                    onChange={(event: SelectChangeEvent) => {
                      setSetting((prev) => {
                        return {
                          ...prev,
                          longExName: event.target.value as ExchangeName,
                        };
                      });
                    }}
                  >
                    {filteredExchanges.map((name) => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box flexGrow={1}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="right"
                  >
                    {buySymbol}
                  </Typography>
                </Box>
              </Box>
              {longOrderBook ? (
                <OrderBookDisplay
                  bids={longOrderBook.bids}
                  asks={longOrderBook.asks}
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
                        sellOrder={shortOrderBook?.bids[0]}
                        buyOrder={longOrderBook?.asks[0]}
                        sellContractSize={contractSize?.sell}
                        buyContractSize={contractSize?.buy}
                      />
                      <SpreadRates
                        isSecondary
                        sellOrder={shortOrderBook?.bids[1]}
                        buyOrder={longOrderBook?.asks[1]}
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
                        sellOrder={longOrderBook?.bids[0]}
                        buyOrder={shortOrderBook?.asks[0]}
                        sellContractSize={contractSize?.sell}
                        buyContractSize={contractSize?.buy}
                      />
                      <SpreadRates
                        isSecondary
                        sellOrder={longOrderBook?.bids[1]}
                        buyOrder={shortOrderBook?.asks[1]}
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
                    color="info"
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
      <Snackbar
        open={Boolean(error?.length)}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
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
