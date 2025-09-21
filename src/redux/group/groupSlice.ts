import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import { type RootState } from "../store";

export interface IGroup {
  _id?: string;
  teleLogId?: string;
  telePriorityId?: string;
  teleLogToken?: string;
  telePriorityToken?: string;
}
export interface GroupState {
  data: IGroup;
  loading: boolean;
  error?: string;
}

export const fetchGroup = createAsyncThunk(
  "group/fetchGroup",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const { data } = await api.get(`/api/v1/groups/${state?.user?.data?.groupId}`);
    return data;
  }
);

const initialState: GroupState = {
  data: {},
  loading: false,
  error: undefined,
};

export const GroupSlice = createSlice({
  name: "Group",
  initialState,
  reducers: {
    setGroup: (state, action: PayloadAction<IGroup>) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroup.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch group";
      });
  },
});

// Action creators are generated for each case reducer function
export const { setGroup } = GroupSlice.actions;

export const selectGroup = (state: { group: GroupState }) =>
  state.group.data;

export default GroupSlice.reducer;
