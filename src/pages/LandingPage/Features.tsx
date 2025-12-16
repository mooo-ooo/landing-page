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
        </Stack>
      </Grid>
      <Grid size={12}>
        <Item sx={{ height: "100%", boxSizing: "border-box" }}>
          <img style={{ width: "100%" }} src="/features/orderbook.png" />
          <Typography mb={2} variant="h6" color="white">
            Orderbook
          </Typography>
          <Typography textAlign='left'>Check the open and close spread between exchanges. We connect using WebSocket to give you the fastest price updates and current funding rates, allowing you to examine the spread between perpetual and spot pairs. Additionally, we also provide two weeks of funding history.</Typography>
        </Item>
      </Grid>
      {/* <Grid size={3}>
        <Item sx={{ height: "100%", boxSizing: "border-box" }}>
          <img style={{ width: "100%" }} src="/features/hedgingbot.png" />
          <Typography mb={2} variant="h6" color="white">
            Hedging bot
          </Typography>
          <Typography textAlign='left'>A cron job runs every 5 seconds to monitor your positions. If the liquidation price or leverage level reaches the set limit, the bot will either transfer funds to hedge the position or close the lacking position to maintain balance.</Typography>
        </Item>
      </Grid> */}
      {/* <Grid size={5}>
        <Item sx={{ height: "100%", boxSizing: "border-box" }}>
          <img style={{ width: "100%" }} src="/features/tele.png" />
          <Typography mb={2} variant="h6" color="white">
            Hedging bot
          </Typography>
          <Typography textAlign='left'>When the threshold is reached, you will receive an emergency notification via Telegram. You must also create and provide us with a Telegram group for receiving these notifications.</Typography>
        </Item>
      </Grid> */}
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
