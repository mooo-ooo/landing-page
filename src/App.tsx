import { Suspense, lazy } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";

// Pages
import Layout from "./Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Signals from "./pages/Signals/SignalsContainer"
import Dashboard from "./pages/Dashboard";
import Wallets from "./pages/Wallets";
import Fundings from "./pages/Fundings";
import Authenticator from "./pages/Authenticator";
import LandingPage from "./pages/LandingPage";
import Strategies from "./pages/Strategies";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import SharedProfile from "./pages/SharedProfile";
import { green } from "./constants/colors";
import ApiKeys from "./pages/ApiKeys";
const Orderbooks = lazy(() => import("./pages/Orderbooks/Container"));
const Settings = lazy(() => import("./pages/Settings"));

// Store
import { Provider } from "react-redux";
import { store } from "./redux/store";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "rgb(240, 185, 11)",
    },
    success: {
      main: green,
    },
  },
  typography: {
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: 12,
  },
});

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
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/2fa-verify" element={<TwoFactorVerify />} />

                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="/2fa" element={<TwoFactorAuth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/shared-profile" element={<SharedProfile />} />
                  <Route path="/wallets" element={<Wallets />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/strategies" element={<Strategies />} />
                  <Route path="/fundings" element={<Fundings />} />
                  <Route path="/api-keys" element={<ApiKeys />} />
                  <Route path="/otps" element={<Authenticator />} />
                  <Route path="orderbooks" element={<Orderbooks />} />
                  <Route path="signals" element={<Signals />} />
                  
                  <Route path="*" element={<Home />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
