import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

interface UserState {
  data: {
    id: string;
    email: string;
    name: string;
    username?: string;
    role: string
    twoFactorEnabled: boolean;
    groupId: number;
    groupCode?: string;
    credit?: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchUserData = createAsyncThunk(
  "user/fetchUserData",
  async () => {
    // 1. Destructure 'data' from the response for cleaner access.
    const { data } = await api.get("/api/v1/auth/me");

    // 2. Destructure properties directly from the 'data' object.
    const {
      id,
      email,
      name,
      role,
      twoFactorEnabled, // API's snake_case key
      groupId, // API's snake_case key
    } = data;

    // 3. Return the mapped camelCase object.
    return {
      id,
      email,
      name,
      role,
      twoFactorEnabled, // Mapped to camelCase
      groupId, // Mapped to camelCase
    };
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearUser: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user data";
      });
  },
});

export const { setUser, setError, clearUser } = userSlice.actions;
export const selectUser = (state: { user: UserState }) => state.user.data;
export default userSlice.reducer;
