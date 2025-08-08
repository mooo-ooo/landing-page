import { Suspense } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import {
  CssBaseline,
} from '@mui/material'

// Pages
import Layout from './Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Wallets from './pages/Wallets'
import Fundings from './pages/Fundings'
import TwoFactorAuth from './pages/TwoFactorAuth'
import TwoFactorVerify from './pages/TwoFactorVerify'
import ApiKeys from './pages/ApiKeys'

// Store
import { Provider } from 'react-redux'
import { store } from './redux/store'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: 'rgb(240, 185, 11)',
    },
  },
  typography: {
    fontFamily: '"Kraken Plex Mono", monospace',
    fontSize: 14,
  },
})

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <BrowserRouter>
            <Suspense fallback={<>loading...</>}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/2fa-verify" element={<TwoFactorVerify />} />
                
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="/2fa" element={<TwoFactorAuth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/wallets" element={<Wallets />} />
                  <Route path="/fundings" element={<Fundings />} />
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="*" element={<Home />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  )
}

export default App