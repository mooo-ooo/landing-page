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
import ApiKeys from "./ApiKeys";
import Telegram from "./Telegram";
import ExchangeLeverages from "./ExchangeLeverages";
import TokenLeverages from "./TokenLeverages";
import { useSearchParams } from "react-router-dom";
import { yellow } from "../../constants/colors";

import VpnKeyIcon from "@mui/icons-material/VpnKey";
import TelegramIcon from "@mui/icons-material/Telegram";
import MarginIcon from "@mui/icons-material/Margin";
import SwapVertIcon from '@mui/icons-material/SwapVert';

const API_KEYS_ROUTE = "api-keys";
const TELE_ROUTE = "telegram";
const EX_LEVS = "exchange-leverages";
const TOKEN_LEVS = "token-leverages";

function Settings() {
  const groupStore = useSelector(selectGroup);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("q") || API_KEYS_ROUTE;
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
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
                onClick={() => setSearchParams({ q: EX_LEVS })}
                sx={{
                  borderLeft: page === EX_LEVS ? `2px solid ${yellow}` : "",
                }}
              >
                <ListItemIcon>
                  <MarginIcon />
                </ListItemIcon>
                <ListItemText primary="Exchange leverages" />
              </ListItemButton>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => setSearchParams({ q: TOKEN_LEVS })}
                sx={{
                  borderLeft: page === TOKEN_LEVS ? `2px solid ${yellow}` : "",
                }}
              >
                <ListItemIcon>
                  <SwapVertIcon />
                </ListItemIcon>
                <ListItemText primary="Distance liquidity (Position)" />
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
            {page === API_KEYS_ROUTE ? <ApiKeys /> : null}
            {page === EX_LEVS ? (
              groupStore._id ? (
                <ExchangeLeverages />
              ) : null
            ) : null}
            {page === TELE_ROUTE ? groupStore._id ? <Telegram /> : null : null}
            {page === TOKEN_LEVS ? (
              groupStore._id ? (
                <TokenLeverages />
              ) : null
            ) : null}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;
