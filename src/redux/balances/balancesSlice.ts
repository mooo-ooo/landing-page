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
    funding: ICurrencyBalance[],
    future: IFuture,
    unified: ICurrencyBalance[]
  },
  huobi: {
    total: number,
    spot: ICurrencyBalance[],
    future: IFuture
  },
  okx: {
    total: number,
    funding: ICurrencyBalance[],
    trading: IFuture
  }
}

const emptyFutureState = {
  marginBalance: 0,
  marginAvailable: 0,
  marginAsset: 'USDT'
}

const initialState: SummaryBalanceState = {
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
    funding: [],
    future: emptyFutureState,
    unified: []
  },
  huobi: {
    total: 0,
    spot: [],
    future: emptyFutureState
  },
  okx: {
    total: 0,
    funding: [],
    trading: emptyFutureState
  }
}

export const SummaryBalanceSlice = createSlice({
  name: 'SummaryBalance',
  initialState,
  reducers: {
    setSummaryBalance: (_state, action: PayloadAction<SummaryBalanceState>) => {
      return action.payload
    },
    setTotalHuobi: (state, action: PayloadAction<number>) => {
      state.huobi.total = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setSummaryBalance, setTotalHuobi } = SummaryBalanceSlice.actions

export default SummaryBalanceSlice.reducer