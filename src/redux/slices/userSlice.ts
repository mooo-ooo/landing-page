import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/axios';

interface UserState {
  data: {
    id: string;
    email: string;
    name: string;
    is2faEnabled: boolean;
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
  'user/fetchUserData',
  async () => {
    const response = await api.get('/api/v1/auth/me');
    return {
      id: response.data.id,
      email: response.data.email,
      name: response.data.name,
      is2faEnabled: response.data.is_2fa_enabled,
    };
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
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
        state.error = action.error.message || 'Failed to fetch user data';
      });
  },
});

export const { clearUser } = userSlice.actions;
export default userSlice.reducer; 