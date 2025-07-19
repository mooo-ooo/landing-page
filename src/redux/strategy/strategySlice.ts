import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface IStrategy {
  strategyName: string // Unique for display and seeking
  // Exchanges name
  sellExchange: string
  buyExchange: string
  sellSymbol: string
  buySymbol: string

  // Spread
  bestInSpread: number // in percentage
  secondInSpread: number
  bestOutSpread: number // in percentage
  secondOutSpread: number

  // Order
  maxOrderVol: number
  requiredOrderVol: number
  
  isIncrease: boolean
  isReduce: boolean

  precision?: number
  multiple?: number

  
  // Vol position
  maxVolOfPosition: number
  minVolOfPosition: number


  percentChangeToSL: number
  alertSL?: number
  alertLiq?: number
  enabaledupdateSL?: boolean
  ignoreCheckSize?: boolean
}
export interface StrategiesState {
  data: IStrategy[]
}

const initialState: StrategiesState = {
  data: []
}

export const StrategiesSlice = createSlice({
  name: 'Strategies',
  initialState,
  reducers: {
    setStrategies: (state, action: PayloadAction<IStrategy[]>) => {
      state.data = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setStrategies } = StrategiesSlice.actions

export default StrategiesSlice.reducer