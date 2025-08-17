import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface ICurrencyBalance {
  amount: number,
  coin: string,
  avgPrice?: number
  usdtValue?: number
}

export interface IFuture {
  marginBalance: number
  marginAvailable: number
  marginAsset: string
  point?: number
}
export interface SummaryBalanceState {
  coinex: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture
  }
  gate: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture
  },
  bitget: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture
  },
  bybit: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture,
  },
  huobi: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture
  },
  okx: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture
  }
}

export interface BalancesStateWithMeta {
  balances: SummaryBalanceState;
  loading: boolean;
  error: string | null;
}

const emptyFutureState = {
  marginBalance: 0,
  marginAvailable: 0,
  marginAsset: 'USDT'
}

const initialState: BalancesStateWithMeta = {
  balances: {
    coinex: {
      total: 0,
      spot: [],
      future: emptyFutureState
    },
    gate: {
      total: 0,
      spot: [],
      future: emptyFutureState
    },
    bitget: {
      total: 0,
      spot: [],
      future: emptyFutureState
    },
    bybit: {
      total: 0,
      spot: [],
      future: emptyFutureState,
    },
    huobi: {
      total: 0,
      spot: [],
      future: emptyFutureState
    },
    okx: {
      total: 0,
      spot: [],
      future: emptyFutureState
    }
  },
  loading: false,
  error: null
}

export const SummaryBalanceSlice = createSlice({
  name: 'SummaryBalance',
  initialState,
  reducers: {
    setSummaryBalance: (state, action: PayloadAction<SummaryBalanceState>) => {
      state.balances = action.payload;
      state.loading = false;
      state.error = null;
    },
    setTotalHuobi: (state, action: PayloadAction<number>) => {
      state.balances.huobi.total = action.payload;
    },
    setBalancesLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setBalancesError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearBalancesError: (state) => {
      state.error = null;
    },
  },
})

// Action creators are generated for each case reducer function
export const { 
  setSummaryBalance, 
  setTotalHuobi, 
  setBalancesLoading, 
  setBalancesError, 
  clearBalancesError 
} = SummaryBalanceSlice.actions

// Selectors
export const selectBalances = (state: { balances: BalancesStateWithMeta }) => state.balances.balances;
export const selectBalancesLoading = (state: { balances: BalancesStateWithMeta }) => state.balances.loading;
export const selectBalancesError = (state: { balances: BalancesStateWithMeta }) => state.balances.error;

export default SummaryBalanceSlice.reducer