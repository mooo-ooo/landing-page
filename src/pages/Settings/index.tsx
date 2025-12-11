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
import { useSelector } from "react-redux";
import { selectGroup } from "../../redux/group/groupSlice";
import { selectUser } from "../../redux/user/userSlice";
import ApiKeys from "./ApiKeys";
import Telegram from "./Telegram";
import BotSettings from "./BotSettings";
import { useSearchParams } from "react-router-dom";
import { yellow } from "../../constants/colors";

import VpnKeyIcon from "@mui/icons-material/VpnKey";
import TelegramIcon from "@mui/icons-material/Telegram";
import AdbIcon from '@mui/icons-material/Adb';
import Profile from "./Profile";
import { AccountBox } from "@mui/icons-material";

const API_KEYS_ROUTE = "api-keys";
const TELE_ROUTE = "telegram";
const BOT_SETTINGS = "bot-settings";
const PROFILE = "profile";

function Settings() {
  const groupStore = useSelector(selectGroup);
  const userStore = useSelector(selectUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("q") || API_KEYS_ROUTE;
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="32px">
      <Grid container>
        <Grid
          size={3}
          sx={{
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRight: "none",
          }}
        >
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSearchParams({ q: PROFILE })}
                sx={{
                  borderLeft:
                    page === PROFILE ? `2px solid ${yellow}` : "",
                }}
              >
                <ListItemIcon>
                  <AccountBox />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSearchParams({ q: API_KEYS_ROUTE })}
                sx={{
                  borderLeft:
                    page === API_KEYS_ROUTE ? `2px solid ${yellow}` : "",
                }}
              >
                <ListItemIcon>
                  <VpnKeyIcon />
                </ListItemIcon>
                <ListItemText primary="API keys" />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSearchParams({ q: TELE_ROUTE })}
                sx={{
                  borderLeft: page === TELE_ROUTE ? `2px solid ${yellow}` : "",
                }}
              >
                <ListItemIcon>
                  <TelegramIcon />
                </ListItemIcon>
                <ListItemText primary="Telegram" />
              </ListItemButton>
            </ListItem>
            
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSearchParams({ q: BOT_SETTINGS })}
                sx={{
                  borderLeft: page === BOT_SETTINGS ? `2px solid ${yellow}` : "",
                }}
              >
                <ListItemIcon>
                  <AdbIcon />
                </ListItemIcon>
                <ListItemText primary="Hedging Bot" />
              </ListItemButton>
            </ListItem>
          </List>
        </Grid>
        <Grid size={9}>
          <Box
            sx={{
              padding: 2,
              border: "1px solid rgba(255, 255, 255, 0.12)",
              // borderLeft: "none",
            }}
          >
            {page === API_KEYS_ROUTE ? <ApiKeys /> : null}
            {page === PROFILE ? (userStore?.id && groupStore._id) ? <Profile /> : null : null}
            {page === TELE_ROUTE ? groupStore._id ? <Telegram /> : null : null}
            {page === BOT_SETTINGS ? (
              groupStore._id ? (
                <BotSettings />
              ) : null
            ) : null}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
