import { PROXY_URL } from '../../config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const ccxt: any;

const binance = new ccxt.pro.binance({});
const mexc = new ccxt.pro.mexc({});
const gate = new ccxt.pro.gate({});
const bitget = new ccxt.pro.bitget({});
const poloniex = new ccxt.pro.poloniex({});
const okx = new ccxt.pro.okx({});
const bybit = new ccxt.pro.bybit({});
const huobi = new ccxt.pro.huobi();
const whitebit = new ccxt.pro.whitebit({});
const kraken = new ccxt.pro.kraken({});
const bingx = new ccxt.pro.bingx({});
const bitmart = new ccxt.pro.bitmart({});
const lbank = new ccxt.pro.lbank({});
const deribit = new ccxt.pro.deribit({});
const coinex = new ccxt.pro.coinex({
  has: {
    fetchCurrencies: false,
    fetchMarkets: false,
  },
});

const PROXY_SERVER = `${PROXY_URL}/`

bingx.proxyUrl = PROXY_SERVER;
coinex.proxyUrl = PROXY_SERVER;
mexc.proxyUrl = PROXY_SERVER;
gate.proxyUrl = PROXY_SERVER;
huobi.proxyUrl = PROXY_SERVER;

export type Exchange =
  | typeof binance
  | typeof mexc
  | typeof gate
  | typeof bitget
  | typeof okx
  | typeof bybit
  | typeof huobi
  | typeof whitebit
  | typeof kraken
  | typeof bitmart
  | typeof poloniex
  | typeof bingx
  | typeof lbank
  | typeof deribit
  | typeof coinex

export const ExchangeMap = {
  binance,
  mexc,
  gate,
  bitget,
  bitmart,
  okx,
  bybit,
  huobi,
  whitebit,
  kraken,
  poloniex,
  bingx,
  lbank,
  deribit,
  coinex,
};

export type ExchangeName = keyof typeof ExchangeMap;