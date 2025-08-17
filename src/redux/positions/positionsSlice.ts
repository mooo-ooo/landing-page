import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type SIDE = 'buy' | 'sell' | 'spot'
export interface IPosition {
  exchange: string
  side: SIDE
  size: number
  baseToken: string
  liqPrice: number
  avgPrice: number
  markPrice: number
  fundingRate: number
  liqPriceRatio: number
  slPrice?: number,
  tpPrice?: number
  unrealizedPnl?: number
}
export interface PostitionsState {
  gate: IPosition[],
  bybit: IPosition[],
  huobi: IPosition[],
  okx: IPosition[],
  coinex: IPosition[],
  mexc: IPosition[],
  bitget: IPosition[],
}

export interface PositionsStateWithMeta {
  positions: PostitionsState;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: PositionsStateWithMeta = {
  positions: {
    gate: [],
    bybit: [],
    huobi: [],
    okx: [],
    coinex: [],
    mexc: [],
    bitget: []
  },
  loading: false,
  error: null,
  lastUpdated: null
}

export const PositionsSlice = createSlice({
  name: 'Positions',
  initialState,
  reducers: {
    setPositions: (state, action: PayloadAction<PostitionsState>) => {
      state.positions = action.payload;
      state.loading = false;
      state.error = null;
      state.lastUpdated = Date.now();
    },
    setPositionsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setPositionsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearPositionsError: (state) => {
      state.error = null;
    },
  },
})

// Action creators are generated for each case reducer function
export const { 
  setPositions, 
  setPositionsLoading, 
  setPositionsError, 
  clearPositionsError 
} = PositionsSlice.actions

// Selectors
export const selectPositions = (state: { positions: PositionsStateWithMeta }) => state.positions.positions;
export const selectPositionsLoading = (state: { positions: PositionsStateWithMeta }) => state.positions.loading;
export const selectPositionsError = (state: { positions: PositionsStateWithMeta }) => state.positions.error;

export default PositionsSlice.reducer