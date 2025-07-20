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

const initialState: PostitionsState = {
  gate: [],
  bybit: [],
  huobi: [],
  okx: [],
  coinex: [],
  mexc: [],
  bitget: []
}

export const PositionsSlice = createSlice({
  name: 'Positions',
  initialState,
  reducers: {
    setPositions: (state, action: PayloadAction<PostitionsState>) => {
      return {
        ...state,
        ...action.payload
      }
    },
  },
})

// Action creators are generated for each case reducer function
export const { setPositions } = PositionsSlice.actions

export default PositionsSlice.reducer