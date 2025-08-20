import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface IStrategy {
  strategyName: string; // Unique for display and seeking
  // Exchanges name
  sellExchange: string;
  buyExchange: string;
  sellSymbol: string;
  buySymbol: string;

  // Spread
  bestInSpread: number; // in percentage
  secondInSpread: number;
  bestOutSpread: number; // in percentage
  secondOutSpread: number;

  // Order
  maxOrderVol: number;
  requiredOrderVol: number;

  isIncrease: boolean;
  isReduce: boolean;

  precision?: number;
  multiple?: number;

  // Vol position
  maxVolOfPosition: number;
  minVolOfPosition: number;

  percentChangeToSL: number;
  alertSL?: number;
  alertLiq?: number;
  enabaledupdateSL?: boolean;
  ignoreCheckSize?: boolean;
}
export interface StrategiesState {
  data: IStrategy[];
  newStrategy: {
    open: boolean;
    baseToken?: string;
  };
}

const initialState: StrategiesState = {
  data: [],
  newStrategy: {
    open: false,
  },
};

export const StrategiesSlice = createSlice({
  name: "Strategies",
  initialState,
  reducers: {
    setStrategies: (state, action: PayloadAction<IStrategy[]>) => {
      state.data = action.payload;
    },
    setNewStrategy: (
      state,
      action: PayloadAction<{
        open: boolean;
        baseToken?: string;
      }>
    ) => {
      state.newStrategy = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setStrategies, setNewStrategy } = StrategiesSlice.actions;

export const selectNewStrategy = (state: { strategies: StrategiesState }) =>
  state.strategies.newStrategy;

export default StrategiesSlice.reducer;
