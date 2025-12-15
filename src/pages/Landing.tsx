import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export const red = "rgb(246, 70, 93)";
export const green = "rgb(14, 203, 129)";
export const yellow = "rgb(240, 185, 11)";

// 1. Custom Theme for Dark Mode and Green Accent
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

const LandingPageHeader = () => {
  const navItems = ["Features", "Integrations", "Docs"];

  // Data for the 4-column feature list
  const featureBlocks = [
    "Stable profit",
    "We don't hold your funds",
    "Low risk",
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          backgroundColor: "rgb(13, 13, 13)",
        }}
      >
        {/* --- 2. Navigation Bar (AppBar) --- */}
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar component={Container} maxWidth="lg">
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                style={{ height: 18, marginRight: "12px" }}
                src="/logo.png"
                alt="logo"
              />
            </Box>

            {/* Navigation Links (Centered) */}
            <Box
              sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
            >
              {navItems.map((item) => (
                <Button
                  key={item}
                  color="inherit"
                  sx={{ mx: 1, textTransform: "none", fontWeight: 500 }}
                >
                  {item}
                </Button>
              ))}
            </Box>

            {/* Action Buttons (Right) */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Button
                variant="outlined"
                sx={{
                  ml: 2,
                  // bgcolor: darkTheme.palette.secondary.main,
                  color: "#ffffff",
                  textTransform: "none",
                  fontWeight: 600,
                  // '&:hover': {
                  //   bgcolor: 'rgb(14, 203, 129)', // A slightly lighter green on hover
                  // }
                }}
              >
                Launch App
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* --- 3. Hero Section --- */}
        <Container maxWidth="lg" sx={{ textAlign: "center", pt: 10, pb: 5 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: "white",
              fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
              fontWeight: 800,
            }}
          >
            The Original Crypto
            <br />
            Farming Funding
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: darkTheme.palette.text.secondary,
              mt: 3,
              mb: 1.5,
              px: { xs: 0, sm: 4, md: 8 },
            }}
          >
            Professional grade order, position and execution management system.
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: darkTheme.palette.text.secondary, mb: 4 }}
          >
            Open your position with good spread.
            <br /> keep your position to earn funding fees.
          </Typography>

          {/* Call to Action Button */}
          <Button
            variant="outlined"
            size="large"
            sx={{
              // bgcolor: yellow,
              color: "white",
              textTransform: "uppercase",
              fontWeight: 700,
              px: 4,
              py: 1.5,
              mt: 2,
              borderRadius: 1,
            }}
          >
            Register Now
          </Button>

          {/* --- 4. Feature Blocks --- */}
          <Grid maxWidth="lg" container justifyContent="center" sx={{ mt: 10 }}>
            {featureBlocks.map((feature, index) => (
              <Grid
                size={12 / featureBlocks.length}
                key={feature}
                sx={{
                  padding: 3,
                  position: "relative",
                  borderRight:
                    index < featureBlocks.length - 1
                      ? "1px solid #333"
                      : "none", // Separator lines
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "white", fontWeight: 500 }}
                >
                  {feature}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>

        <Container sx={{ textAlign: "center", pb: 15, position: 'relative', padding: '0px !important', paddingBottom: 20 }}>
          <Typography
            variant="h3"
            component="h2"
            width='100%'
            position='absolute'
            top='10px'
            sx={{
              color: darkTheme.palette.text.secondary,
              fontWeight: 800,
              mt: 3,
              mb: 1.5,
              px: { xs: 0, sm: 4, md: 8 },
            }}
          >
            Exchanges
          </Typography>
          <Box sx={{ mixBlendMode: 'screen'}} paddingBottom={20}>
            <video muted style={{ objectFit: 'cover', width: '100%', height: '100%'}} playsInline autoPlay loop>
              <source src="/bg-wave.mp4" type="video/mp4" />
            </video>
          </Box>
          
          <Box sx={{
            background: 'linear-gradient(180deg,#0f0f0f00,#0f0f0fd9 10%,#242323)',
            position: 'absolute',
            top: '250px',
            borderRadius: '20px',
            left: '50%',
            padding: '24px',
            transform: 'translate(-50%)',
            minWidth: '90%',
            justifyContent: 'center'
          }} gap={8} display='flex' flexWrap='wrap' flexDirection='row'>
            {exchanges.map(exchange => {
              return <Box><img style={{ height: '32px'}} src={`/exchanges/${exchange}.png`} /></Box>
            })}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

const exchanges: string[] = ['coinex', 'huobi', 'bitget', 'gate', 'bybit', 'binance', 'kucoin', 'okx']
export default LandingPageHeader;
