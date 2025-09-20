import { useState, useEffect } from "react";
import {
  Box,
  Card,
  Grid,
  Typography,
  CardContent,
  TextField,
  InputLabel,
  Button,
  Stack,
  IconButton,
  Skeleton,
  Snackbar,
  Alert,
} from "@mui/material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import IndeterminateCheckBoxIcon from "@mui/icons-material/IndeterminateCheckBox";
import { useInterval } from "usehooks-ts";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import numeral from "numeral";
import styled from "@emotion/styled";
import { type Order, type OrderBook } from "./types";
import { ExchangeMap, type Exchange } from "./constants";
import { type Num } from "./types";

const favExchanges = "favExchanges";
const disablesExchanges = "disablesExchanges";

const cachedExchange = JSON.parse(localStorage.getItem(favExchanges) || "{}");
const cachedExchangeSettings: string[] = JSON.parse(
  localStorage.getItem(disablesExchanges) || "[]"
);

function Orderbooks({
  depth = 2,
  id,
  removeOrderbook,
}: {
  depth?: number;
  id: number;
  removeOrderbook: (id: number) => void;
}) {
  const [baseToken, setBaseToken] = useState<string>("");
  const [isPlaying, setPlaying] = useState<boolean>(true);
  const [error, setError] = useState<string>();

  const [longOrderBook, setLongOrderBook] = useState<OrderBook>();
  const [shortOrderBook, setShortOrderBook] = useState<OrderBook>();

  const [buySymbol, setbuySymbol] = useState<string>(
    cachedExchange?.buySymbol || "DOGE/USDT:USDT"
  );
  const [sellSymbol, setsellSymbol] = useState<string>(
    cachedExchange?.sellSymbol || "DOGE/USDT:USDT"
  );

  const [longEx, setLongEx] = useState<Exchange>();
  const [shortEx, setShortEx] = useState<Exchange>();

  const [longExName, setLongExName] = useState<ExchangeName>(
    cachedExchange?.longExName || "okx"
  );
  const [shortExName, setShortExName] = useState<ExchangeName>(
    cachedExchange?.shortExName || "bybit"
  );

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
    if (!baseToken && (buySymbol === sellSymbol)) {
      const token = buySymbol.split("/")[0]
      setBaseToken(token)
    }
  }, [buySymbol, sellSymbol, baseToken])

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
    isPlaying ? 277 : null
  );

  const preserveExchanges = () => {
    localStorage.setItem(
      favExchanges,
      JSON.stringify({
        longExName,
        shortExName,
        sellSymbol,
        buySymbol,
      })
    );
  };

  const goWatch = () => {
    setShortExName(setting.shortExName);
    setLongExName(setting.longExName);
    setsellSymbol(setting.sellSymbol);
    setbuySymbol(setting.buySymbol);
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

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Card sx={{ background: "rgb(30, 32, 38)" }}>
        <CardContent
          sx={{ padding: "12px", "&:last-child": { paddingBottom: 1 } }}
        >
          <Grid container>
            <Grid size={4}>
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
              </Box>
              {shortOrderBook ? (
                <OrderBookDisplay
                  bids={shortOrderBook.bids}
                  asks={shortOrderBook.asks}
                  formated="0.00000"
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
              size={4}
              sx={{ paddingLeft: "16px", borderLeft: "1px solid #9E9E9E" }}
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
              </Box>
              {longOrderBook ? (
                <OrderBookDisplay
                  bids={longOrderBook.bids}
                  asks={longOrderBook.asks}
                  formated="0.00000"
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
              size={4}
              sx={{
                paddingLeft: "16px",
                borderLeft: "1px solid #9E9E9E",
                position: "relative",
              }}
            >
              <Box>
                <Box display="flex" justifyContent="space-between" mb={4}>
                  <TextField
                    label="Base Token"
                    value={baseToken}
                    variant="standard"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setBaseToken(event.target.value as string);
                    }}
                  />
                  <Box mt="16px">
                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={goWatch}
                        color="info"
                        variant="contained"
                      >
                        Go Watch
                      </Button>

                      <Button
                        onClick={() => setPlaying((prev) => !prev)}
                        color={isPlaying ? "inherit" : "error"}
                        variant="contained"
                      >
                        Pause
                      </Button>
                    </Stack>
                  </Box>
                </Box>
                <Box>
                  <Grid container>
                    <Grid size={3}>
                    </Grid>
                    <Grid size={9} mb={2}>
                      <Grid container>
                        <Grid size={6}><Typography color="textSecondary">Spread rate</Typography></Grid>
                        <Grid size={6}><Typography color="textSecondary">Volume</Typography></Grid>
                      </Grid>
                    </Grid>
                    <Grid size={3}>
                      <TypoStyled>Open:</TypoStyled>
                    </Grid>
                    <Grid size={9}>
                      <SpreadRates
                        sellOrder={shortOrderBook?.bids[0]}
                        buyOrder={longOrderBook?.asks[0]}
                      />
                      <SpreadRates
                        isSecondary
                        sellOrder={shortOrderBook?.bids[1]}
                        buyOrder={longOrderBook?.asks[1]}
                      />
                    </Grid>
                  </Grid>
                  <Grid container>
                    <Grid size={3}>
                      <TypoStyled>Close:</TypoStyled>
                    </Grid>
                    <Grid size={9}>
                      <SpreadRates
                        sellOrder={longOrderBook?.bids[0]}
                        buyOrder={longOrderBook?.asks[0]}
                      />
                      <SpreadRates
                        isSecondary
                        sellOrder={shortOrderBook?.bids[1]}
                        buyOrder={shortOrderBook?.asks[0]}
                      />
                    </Grid>
                  </Grid>

                  <AddingVsRemoving>
                    <Stack spacing={1}>
                      <IconButton onClick={preserveExchanges} color="info">
                        <BookmarkAddIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => removeOrderbook(id)}
                        color="error"
                      >
                        <IndeterminateCheckBoxIcon />
                      </IconButton>
                    </Stack>
                  </AddingVsRemoving>
                </Box>
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
  isSecondary = false
}: {
  sellOrder: [Num, Num] | undefined;
  buyOrder: [Num, Num] | undefined;
  isSecondary?: boolean
}) => {
  const spread = sellOrder && buyOrder ? calculateSpread(sellOrder[0] || 0, buyOrder[0] || 0) : 0
  return (
    <Grid container sx={{opacity: isSecondary ? 0.4 : 1}}>
      <Grid size={6}>
        <TypoStyled color={spread > 0 ? "rgb(14, 203, 129)" : "rgb(246, 70, 93)"}>
          {sellOrder && buyOrder
            ? numeral(
                spread
              ).format("0.000")
            : null}
          %
        </TypoStyled>
      </Grid>
      <Grid size={6}>
        <TypoStyled variant="caption" gutterBottom>
          {numeral(
            Math.min(
              (buyOrder?.[0] || 0) * (buyOrder?.[1] || 0),
              (sellOrder?.[0] || 0) * (sellOrder?.[1] || 0)
            )
          ).format("0,0")}
          $
        </TypoStyled>
      </Grid>
    </Grid>
  );
};

const OrderBookDisplay = ({
  bids,
  asks,
}: {
  bids: Order[];
  asks: Order[];
  formated?: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calOrderBooks = (depths: any[], reversed = false) => {
    const _depths = [...depths];

    const res = _depths.reduce((prev, depth) => {
      const { totalAmount = 0, totalCost = 0 } = prev[prev.length - 1] || {};
      const [bookPrice, bookAmount] = depth;
      const newDepth = {
        price: bookPrice,
        amount: bookAmount,
        totalAmount: bookAmount + totalAmount,
        totalCost: bookPrice * bookAmount + totalCost,
      };

      return [...prev, newDepth];
    }, []);

    return reversed ? res.reverse() : res;
  };

  const bidBooks = calOrderBooks(bids, false);
  const askBooks = calOrderBooks(asks, true);

  return (
    <Box>
      <Grid container>
        <Grid size={4.5}>
          <TypoStyled color="textSecondary">
            Price
          </TypoStyled>
        </Grid>
        <Grid size={4.5}>
          <TypoStyled color="textSecondary">
            Amount
          </TypoStyled>
        </Grid>
        <Grid size={3}>
          <TypoStyled color="textSecondary">
            Volume
          </TypoStyled>
        </Grid>
      </Grid>
      <Box py="4px" />
      {askBooks.map(
        ({
          price,
          totalAmount,
          totalCost,
        }: {
          price: number;
          totalAmount: number;
          totalCost: number;
        }) => {
          return (
            <Grid container key={price}>
              <Grid size={4.5}>
                <TypoStyled
                  color="rgb(187, 51, 54)"
                  variant="caption"
                  gutterBottom
                >
                  {numeral(price).format("0,0.0[000000]")}
                </TypoStyled>
              </Grid>
              <Grid size={4.5}>
                <TypoStyled variant="caption" gutterBottom>
                  {numeral(totalAmount).format("0,0.0[000000]")}
                </TypoStyled>
                {/* <Typography sx={{color: "#9e9e9e"}} variant="caption" gutterBottom>
                  ({numeral(amount).format(formated)})
              </Typography> */}
              </Grid>
              <Grid size={3}>
                <TypoStyled variant="caption" gutterBottom>
                  {numeral(totalCost).format("0,0")}
                </TypoStyled>
              </Grid>
              {/* <Grid size={3}>
              <TypoStyled variant="caption" gutterBottom>
                {numeral(totalCost / totalAmount).format('0,0.0[00]')}
              </TypoStyled>
            </Grid> */}
            </Grid>
          );
        }
      )}
      <Box py="12px">
        <Typography sx={{ fontSize: "13px" }}>
          Spread:{" "}
          {numeral(
            calculateSpread(asks[0][0] as number, bids[0][0] as number)
          ).format("0.0[00]")}
          %
        </Typography>
      </Box>
      {bidBooks.map(
        ({
          price,
          totalAmount,
          totalCost,
        }: {
          price: number;
          totalAmount: number;
          totalCost: number;
        }) => {
          return (
            <Grid container key={price}>
              <Grid size={4.5}>
                <TypoStyled
                  color="rgb(17, 136, 96)"
                  variant="caption"
                  gutterBottom
                >
                  {numeral(price).format("0,0.0[000000]")}
                </TypoStyled>
              </Grid>
              <Grid size={4.5}>
                <TypoStyled variant="caption" gutterBottom>
                  {numeral(totalAmount).format("0,0.0[000000]")}
                </TypoStyled>
                {/* <Typography sx={{color: "#9e9e9e"}} variant="caption" gutterBottom>
                  ({numeral(amount).format(formated)})
              </Typography> */}
              </Grid>
              <Grid size={3}>
                <TypoStyled variant="caption" gutterBottom>
                  {numeral(totalCost).format("0,0")}
                </TypoStyled>
              </Grid>
              {/* <Grid size={3}>
              <TypoStyled variant="caption" gutterBottom>
                {numeral(totalCost / totalAmount).format('0,0.0[00]')}
              </TypoStyled>
            </Grid> */}
            </Grid>
          );
        }
      )}
    </Box>
  );
};

const TypoStyled = styled(Typography)`
  font-size: 16px;
  font-family: "Kraken Plex Mono", monospace;
`;

export default Orderbooks;

const calculateSpread = (highPrice: number, lowPrice: number) => {
  const gap = Number(highPrice) - Number(lowPrice);
  const gapPercentage = (gap / highPrice) * 100;
  return gapPercentage;
};

type ExchangeName = keyof typeof ExchangeMap;

const AddingVsRemoving = styled(Box)`
  position: absolute;
  bottom: 10px;
  right: 10px;
`;
