import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

interface FundingFeesState {
  last7days: {date: string, value: number}[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: FundingFeesState = {
  last7days: null,
  loading: false,
  error: null,
};

export const fetchLast7Days = createAsyncThunk(
  "fundingFees/fetchLast7Days",
  async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // 1. Destructure 'data' from the response for cleaner access.
    return api.get(`/api/v1/funding-fees/last-7-days?tz=${tz}&fromDate=${Date.now()}`)
    .then((result: { data: { fundingByDay: Record<string, number> } }) => {
      if (
        result.data?.fundingByDay &&
        Object.keys(result.data.fundingByDay).length > 0
      ) {
        const fundingByDay = result.data.fundingByDay;

        const fullToShortMap: Record<string, string> = {
          Monday: "Mon",
          Tuesday: "Tue",
          Wednesday: "Wed",
          Thursday: "Thu",
          Friday: "Fri",
          Saturday: "Sat",
          Sunday: "Sun",
        };

        const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Get today's index in short form: 0 = Sun, 1 = Mon, ..., 6 = Sat
        const todayIndex = new Date().getDay();

        // Create circular day order ending with today
        const circularOrder = [
          ...shortDays.slice((todayIndex + 1) % 7),
          ...shortDays.slice(0, (todayIndex + 1) % 7),
        ];

        const mappedHistory = circularOrder.map((shortName) => {
          const fullName = Object.keys(fullToShortMap).find(
            (key) => fullToShortMap[key] === shortName
          )!;
          return {
            date: shortName,
            value: fundingByDay[fullName] || 0,
          };
        });
        return mappedHistory;
      }
    })
  }
);

const fundingFeesSlice = createSlice({
  name: "fundingFees",
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLast7Days.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLast7Days.fulfilled, (state, action) => {
        state.loading = false;
        state.last7days = action.payload || null;
      })
      .addCase(fetchLast7Days.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user data";
      });
  },
});

export const selectFundingLast7days = (state: { fundingFees: FundingFeesState }) => state.fundingFees.last7days;
export default fundingFeesSlice.reducer;
