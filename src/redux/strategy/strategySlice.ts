import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";

export interface IStrategy {
  _id: string;
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

  swapAmount?: number
}
export interface StrategiesState {
  data: IStrategy[];
  newStrategy: {
    open: boolean;
    baseToken?: string;
  };
  launchStrategy: {
    open: boolean;
    baseToken?: string;
  };
  updateStrategy: {
    open: boolean;
    baseToken?: string;
    id?: string;
  };
  loading: boolean;
  error?: string;
}

export const fetchStrategies = createAsyncThunk(
  "strategies/fetchStrategies",
  async () => {
    const { data } = await api.get("/api/v1/strategies");
    return data;
  }
);

const initialState: StrategiesState = {
  data: [],
  newStrategy: {
    open: false,
  },
  launchStrategy: {
    open: false,
  },
  updateStrategy: {
    open: false,
  },
  loading: false,
  error: undefined,
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
    setLaunchStrategy: (
      state,
      action: PayloadAction<{
        open: boolean;
        baseToken?: string;
      }>
    ) => {
      state.launchStrategy = action.payload;
    },
    setUpdateStrategy: (
      state,
      action: PayloadAction<{
        open: boolean;
        baseToken?: string;
        id?: string;
      }>
    ) => {
      state.updateStrategy = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStrategies.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchStrategies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStrategies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch Strategies";
      });
  },
});

// Action creators are generated for each case reducer function
export const { setStrategies, setNewStrategy, setUpdateStrategy, setLaunchStrategy } =
  StrategiesSlice.actions;

export const selectNewStrategy = (state: { strategies: StrategiesState }) =>
  state.strategies.newStrategy;
export const selectUpdateStrategy = (state: { strategies: StrategiesState }) =>
  state.strategies.updateStrategy;
export const selectLaunchStrategy = (state: { strategies: StrategiesState }) =>
  state.strategies.launchStrategy;

export const selectStrategies = (state: { strategies: StrategiesState }) =>
  state.strategies.data;

export default StrategiesSlice.reducer;
