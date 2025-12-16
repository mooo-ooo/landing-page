import { type FC } from "react";
import { Stack, Grid, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
// import useMediaQuery from "@mui/material/useMediaQuery";

const Features: FC = () => {
  // const isWeb = useMediaQuery("(min-width:600px)");

  return (
    <Grid container spacing={4}>
      <Grid size={4}>
        <Item sx={{ height: "100%", boxSizing: "border-box" }}>
          <img style={{ width: "100%" }} src="/features/dashboard.png" />
          <Typography mb={2} variant="h6" color="white">
            Manage and monitor your positions
          </Typography>
          <Typography textAlign='left'>Monitor your positions from multiple devices, supporting web and mobile, view 'liquidation price distance,' 'funding history,' and much more.</Typography>
        </Item>
      </Grid>
      <Grid size={8}>
        <Stack spacing={2}>
          <Item>
            <img style={{ width: "100%" }} src="/features/wallets.png" />
            <Typography mb={2} variant="h6" color="white">
              Transfer funds between whitelisted exchanges
            </Typography>
            <Typography textAlign='left'>Your assets can only be transferred to whitelisted addresses, secured by the exchange's own API rules, meaning no one can withdraw your assets elsewhere.</Typography>
          </Item>
          <Item>
            <img style={{ width: "100%" }} src="/features/bot.png" />
            <Typography mb={2} variant="h6" color="white">
              Create strategies, run, and monitor your bots on PM2
            </Typography>
            <Typography textAlign='left'>After customizing the open spread and maximum volumes, you can use the UI to deploy your strategy to open or close positions.</Typography>
          </Item>
          {/* <Item>
            <img style={{ width: "100%" }} src="/features/keys.png" />
            <Typography>Connect crypto exchange API keys</Typography>
          </Item> */}
        </Stack>
      </Grid>
    </Grid>
  );
};

const Item = styled(Box)(({ theme }) => ({
  borderRadius: '4px',
  padding: '12px',
  background: 'linear-gradient(180deg,#0f0f0f00,#0f0f0fd9 10%,#242323)',
  paddingBottom: 24,
  textAlign: "center",
  color: (theme.vars ?? theme).palette.text.secondary,
  // ...theme.applyStyles("dark", {
  //   backgroundColor: "#1A2027",
  // }),
  // Target the 'img' tag inside this Item
  '& img': {
    marginBottom: 12,
    opacity: 0.6, // Default opacity
    transition: 'opacity 0.3s ease-in-out', // Smooth transition
    width: "100%", // Ensures image remains responsive
  },

  // State when the mouse hovers over the Item
  '&:hover img': {
    opacity: 1, // Full opacity on hover
  },

  // Ensure the image fits the container
  '& img[style]': {
      width: '100%',
  }
}));

export default Features;
