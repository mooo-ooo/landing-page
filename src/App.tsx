import { Suspense } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { CssBaseline } from "@mui/material";

import LandingPage from "./pages/LandingPage";
import { green } from "./constants/colors";

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
                <Route path="/" element={<LandingPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
