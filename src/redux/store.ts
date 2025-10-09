import { configureStore } from '@reduxjs/toolkit'
import balancesReducer from './balances/balancesSlice'
import userReducer from './user/userSlice'
import positionsReducer from './positions/positionsSlice'
import strategiesReducer from './strategy/strategySlice'
import groupReducer from './group/groupSlice'

export const store = configureStore({
  reducer: {
    balances: balancesReducer,
    user: userReducer,
    positions: positionsReducer,
    strategies: strategiesReducer,
    group: groupReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Infer the `