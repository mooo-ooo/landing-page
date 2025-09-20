import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  List,
  ListItemText,
  Box,
  Grid,
  Divider,
} from "@mui/material";
import ApiKeys from "./ApiKeys";

import VpnKeyIcon from "@mui/icons-material/VpnKey";
import TelegramIcon from "@mui/icons-material/Telegram";
function Settings() {
  return (
    <Box
      maxWidth="lg"
      display="flex"
      flexDirection="column"
      gap="12px"
      py="16px"
    >
      <Grid container>
        <Grid
          size={3}
          sx={{
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRight: "none",
          }}
        >
          <List>
            <ListItem disablePadding>
              <ListItemButton component="a" href="/api-keys">
                <ListItemIcon>
                  <VpnKeyIcon />
                </ListItemIcon>
                <ListItemText primary="API keys" />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton component="a" href="telegram">
                <ListItemIcon>
                  <TelegramIcon />
                </ListItemIcon>
                <ListItemText primary="Telegram" />
              </ListItemButton>
            </ListItem>
          </List>
        </Grid>
        <Grid size={9}>
          <Box
            sx={{
              padding: 2,
              background: "rgb(30, 32, 38)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderLeft: "none",
            }}
          >
            <ApiKeys />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
