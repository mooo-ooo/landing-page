import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Grid,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export const red = "rgb(246, 70, 93)"
export const green = "rgb(14, 203, 129)"
export const yellow = "rgb(240, 185, 11)"

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
  const navItems = ['Features', 'Integrations', 'Docs'];

  // Data for the 4-column feature list
  const featureBlocks = [
    'Stable profit',
    'We don\'t hold your funds',
    'Withdraw anytime',
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{
        flexGrow: 1,
        minHeight: '100vh',
        backgroundColor: "#1a1a1a",
      }}>

        {/* --- 2. Navigation Bar (AppBar) --- */}
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar component={Container} maxWidth="lg">
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img
                style={{ height: 18, marginRight: "12px" }}
                src="/logo.png"
                alt="logo"
              />
            </Box>

            {/* Navigation Links (Centered) */}
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              {navItems.map((item) => (
                <Button key={item} color="inherit" sx={{ mx: 1, textTransform: 'none', fontWeight: 500 }}>
                  {item}
                </Button>
              ))}
            </Box>

            {/* Action Buttons (Right) */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                sx={{
                  ml: 2,
                  // bgcolor: darkTheme.palette.secondary.main,
                  color: '#ffffff',
                  textTransform: 'none',
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
        <Container maxWidth="md" sx={{ textAlign: 'center', pt: 10, pb: 15 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: 'white',
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              fontWeight: 800,
            }}
          >
            The Original Crypto<br />Farming Funding
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: darkTheme.palette.text.secondary, mt: 3, mb: 1.5, px: { xs: 0, sm: 4, md: 8 } }}
          >
            Professional grade order, position and execution management system.
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: darkTheme.palette.text.secondary, mb: 4 }}
          >
            Open your position with good spread.<br /> keep your position to earn funding fees.
          </Typography>

          {/* Call to Action Button */}
          <Button
            variant="contained"
            size="large"
            sx={{
              bgcolor: yellow,
              color: 'white',
              textTransform: 'uppercase',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              mt: 2,
              borderRadius: 1,
              // '&:hover': {
              //   bgcolor: '#4caf50',
              // }
            }}
          >
            Check signal Now
          </Button>

          {/* --- 4. Feature Blocks --- */}
          <Grid container justifyContent="center" sx={{ mt: 10 }}>
            {featureBlocks.map((feature, index) => (
              <Grid
                size={12 / featureBlocks.length}
                key={feature}
                sx={{
                  padding: 3,
                  position: 'relative',
                  borderRight: index < featureBlocks.length - 1 ? '1px solid #333' : 'none', // Separator lines
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 500 }}>
                  {feature}
                </Typography>
              </Grid>
            ))}
          </Grid>

        </Container>

        {/* The section for the bottom image will go here */}
        <Box sx={{ height: '400px', width: '100%', textAlign: 'center', color: '#555', pt: 5 }}>
          {/* Placeholder for the large image you mentioned */}
          <Typography variant="body1">
            (The trading platform image will be placed here)
          </Typography>
        </Box>

      </Box>
    </ThemeProvider>
  );
};

export default LandingPageHeader;