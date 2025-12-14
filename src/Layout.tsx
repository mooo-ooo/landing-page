import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./redux/store";
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  LinearProgress,
  Drawer,
  ListItem,
  List,
  ListItemButton,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  VpnKey,
  Security,
  Logout,
  Email,
  MonetizationOn,
  ContentCopy,
  Group,
} from "@mui/icons-material";
import MenuIcon from '@mui/icons-material/Menu'
import useMediaQuery from '@mui/material/useMediaQuery'
import ReplayIcon from "@mui/icons-material/Replay";
import { styled } from "@mui/system";
import api from "./lib/axios";
import numeral from "numeral";
import NewStrategyDialog from "./components/StrategyDialog/NewStrategy";
import UpdateStrategy from "./components/StrategyDialog/UpdateStrategy";
import LaunchBotConfirmationDialog from "./components/StrategyDialog/LaunchBotConfirmationDialog"
import {
  fetchStrategies,
} from "./redux/strategy/strategySlice";
import { fetchLast7Days } from "./redux/fundingFees/fundingFeesSlice";
import { setUser, setError, selectUser } from "./redux/user/userSlice";
import {
  setSummaryBalance,
  selectBalances,
  setBalancesError,
} from "./redux/balances/balancesSlice";
import {
  selectNewStrategy,
  setNewStrategy,
  setUpdateStrategy,
  selectUpdateStrategy,
  setLaunchStrategy,
  selectLaunchStrategy
} from "./redux/strategy/strategySlice";
import { fetchGroup } from "./redux/group/groupSlice";
import {
  setPositions,
  setPositionsError,
  setPositionsLoading,
  selectPositionsLoading,
} from "./redux/positions/positionsSlice";

function Layout() {
  const isWeb = useMediaQuery('(min-width:600px)')
  const didRun = useRef(false);
  const initialized = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const newStrategyProps = useSelector(selectNewStrategy);
  const updateStrategyProps = useSelector(selectUpdateStrategy);
  const launchStrategy = useSelector(selectLaunchStrategy)
  const user = useSelector((state: RootState) => state.user.data);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openDrawer, setOpenDrawer] = useState(false)
  const [localError, setLocalError] = useState<string>();
  const [copySuccess, setCopySuccess] = useState(false);
  const isMenuOpen = Boolean(anchorEl);
  const balances = useSelector(selectBalances);
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpenDrawer(newOpen)
  }
  const positionLoading = useSelector(selectPositionsLoading);
  const { email, credit, groupCode, twoFactorEnabled } =
    useSelector(selectUser) || {};

  const totalMargin = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );

  const fetchBalance = () => {
    setPositionsLoading(true);
    dispatch(fetchLast7Days());
    Promise.all([
      api
        .get("/api/v1/account/equities")
        .then(function ({ data }) {
          dispatch(setSummaryBalance(data));
        })
        .catch(function (error) {
          dispatch(setBalancesError(error.response.data?.message));
        }),
      api
        .get("/api/v1/positions")
        .then(function ({ data }) {
          dispatch(setPositions(data));
        })
        .catch(function (error) {
          dispatch(setPositionsError(error.response.data?.message));
        }),
    ]).finally(() => setPositionsLoading(false));
  };

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    const token = localStorage.getItem("token");

    if (token) {
      // Fetch user info
      api
        .get("/api/v1/auth/me")
        .then((response) => {
          const userData = response.data;
          dispatch(
            setUser(userData)
          );
          dispatch(fetchGroup());
          // Store groupId in localStorage for axios interceptor
          if (userData.groupId) {
            localStorage.setItem("groupId", userData.groupId.toString());
          }
        })
        .catch((err) => {
          // If token is invalid, clear it and redirect to login
          localStorage.removeItem("token");
          dispatch(setError(err.message || "Failed to fetch user data"));
          navigate("/login");
        });
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchBalance();
    }, 1000 * 60 * 5);
    if (!initialized.current) {
      initialized.current = true;
      fetchBalance();
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch(fetchStrategies())
    }, 1000 * 60);
    if (!initialized.current) {
      initialized.current = true;
      dispatch(fetchStrategies())
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set x-group-id header when user data is available
  useEffect(() => {
    if (user?.groupId) {
      api.defaults.headers.common["group-id"] = user.groupId.toString();
    }
  }, [user?.groupId]);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setLocalError(undefined);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("groupId");
    navigate("/login");
    handleMenuClose();
  };

  const handleCopyGroupCode = () => {
    if (groupCode) {
      navigator.clipboard.writeText(groupCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const menuId = "primary-search-account-menu";

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          padding: "0px",
          minWidth: "200px",
        },
      }}
    >
      <Box
        sx={{
          py: 2,
          px: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Email sx={{ mr: 2, fontSize: 20, color: "text.secondary" }} />
          <Typography variant="body1">{email}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <MonetizationOn
            sx={{ mr: 2, fontSize: 20, color: "text.secondary" }}
          />
          <Typography variant="body1">
            {credit?.toFixed(2) || "0.00"}
          </Typography>
        </Box>

        {groupCode && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Group sx={{ mr: 2, fontSize: 20, color: "text.secondary" }} />
              <Typography variant="body1">{groupCode}</Typography>
            </Box>
            <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
              <IconButton
                onClick={handleCopyGroupCode}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { color: "primary.main" },
                }}
              >
                <ContentCopy sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      <MenuItem
        onClick={() => {
          handleMenuClose();
          navigate("/settings");
        }}
        sx={{ py: 1.5 }}
      >
        <VpnKey sx={{ mr: 2, fontSize: 20 }} />
        Profile/Settings
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleMenuClose();
          navigate("/2fa");
        }}
        sx={{
          py: 1.5,
          color: !twoFactorEnabled ? "warning.main" : "inherit",
          "&:hover": {
            backgroundColor: !twoFactorEnabled ? "warning.dark" : undefined,
          },
        }}
      >
        <Security sx={{ mr: 2, fontSize: 20 }} />
        2FA Setup
        {!twoFactorEnabled && (
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              color: "warning.main",
              fontWeight: "bold",
            }}
          >
            (Required)
          </Typography>
        )}
      </MenuItem>
      
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <Logout sx={{ mr: 2, fontSize: 20 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  const Mobile = (
    <AppBar position="fixed" sx={{ background: "#181a20" }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={toggleDrawer(true)}
        >
          <MenuIcon sx={{ fontSize: 26}}/>
        </IconButton>
        <Box sx={{ flexGrow: 1 }} display="flex" justifyContent="center">
          <img style={{ height: 16 }} src="/logo.png" alt="logo" />
        </Box>
        
        <Typography>
          ~{numeral(totalMargin).format("0,0.0")} USDT
        </Typography>
        <IconButton onClick={fetchBalance} color="primary">
          <ReplayIcon />
        </IconButton>
      </Toolbar>
      {positionLoading ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      ) : null}
    </AppBar>
  )

  const DrawerList = (
    <Box sx={{ width: 250, background: "rgb(30, 32, 38)", height: "inherit" }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        <ListItem>
          <Email sx={{ mr: 2, fontSize: 20, color: "text.secondary" }} />
          <Typography variant="body1">{email}</Typography>
        </ListItem>

        <ListItem>
          <MonetizationOn
            sx={{ mr: 2, fontSize: 20, color: "text.secondary" }}
          />
          <Typography variant="body1">
            {credit?.toFixed(2) || "0.00"}
          </Typography>
        </ListItem>
      </List>
      
      <List>
        <ListItem disablePadding>
          <LinkStyled to="/">
            <ListItemButton>
              <Typography fontSize={16}>Home</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/wallets">
            <ListItemButton>
              <Typography fontSize={16}>Wallets</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/strategies">
            <ListItemButton>
              <Typography fontSize={16}>Strategies</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <ListItem disablePadding>
          <LinkStyled to="/shared-profile">
            <ListItemButton>
              <Typography fontSize={16}>Shared Profile</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <Typography fontSize={16}>Logout</Typography>
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box mt="60px">
      <Box sx={{ flexGrow: 1 }}>
        {isWeb ? (
          <AppBar position="fixed" sx={{ background: "#181a20" }}>
            <Toolbar>
              <Box display="flex" justifyContent="space-between" gap="36px">
                <Link to="/">
                  <img
                    style={{ height: 18, marginRight: "12px" }}
                    src="/logo.png"
                    alt="logo"
                  />
                </Link>
                
                <LinkStyled
                  to="/strategies"
                  isActive={location.pathname === "/strategies"}
                >
                  Strategies
                </LinkStyled>
                
                <LinkStyled
                  to="/tools"
                  isActive={location.pathname === "/signal"}
                >
                  Signal
                </LinkStyled>
                <LinkStyled
                  to="/orderbooks"
                  isActive={location.pathname === "/orderbooks"}
                >
                  Orderbooks
                </LinkStyled>
                <LinkStyled
                  to="/wallets"
                  isActive={location.pathname === "/wallets"}
                >
                  Wallets
                </LinkStyled>
                <LinkStyled
                  to="/fundings"
                  isActive={location.pathname === "/fundings"}
                >
                  Funding Fees
                </LinkStyled>
                <LinkStyled
                  to="/shared-profile"
                  isActive={location.pathname === "/shared-profile"}
                >
                  Shared Profile
                </LinkStyled>
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: { xs: "none", md: "flex" } }}>
                {email ? (
                  <Box>
                    <IconButton onClick={fetchBalance} color="primary">
                      <ReplayIcon />
                    </IconButton>
                    ~{numeral(totalMargin).format("0,0.0")} USDT
                    <IconButton
                      size="large"
                      edge="end"
                      aria-label="account of current user"
                      aria-controls={menuId}
                      aria-haspopup="true"
                      onClick={handleProfileMenuOpen}
                      color="inherit"
                    >
                      <AccountCircle />
                    </IconButton>
                  </Box>
                ) : (
                  <LinkStyled to="/login">Login</LinkStyled>
                )}
              </Box>
            </Toolbar>
            {positionLoading ? (
              <Box sx={{ width: "100%" }}>
                <LinearProgress />
              </Box>
            ) : null}
          </AppBar>
        ) : (
          Mobile
        )}

        {isWeb ? (
          renderMenu
        ) : (
          <Drawer open={openDrawer} onClose={toggleDrawer(false)}>
            {DrawerList}
          </Drawer>
        )}
      </Box>
      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
      <Container id="content-layout" maxWidth="xl">
        <Outlet />
      </Container>
      {newStrategyProps?.open ? (
        <NewStrategyDialog
          {...newStrategyProps}
          onClose={() => dispatch(setNewStrategy({ open: false }))}
        />
      ) : null}
      {updateStrategyProps?.open ? (
        <UpdateStrategy
          {...updateStrategyProps}
          onClose={() => dispatch(setUpdateStrategy({ open: false }))}
        />
      ) : null}
      {launchStrategy?.open ? (
        <LaunchBotConfirmationDialog
          {...launchStrategy}
          onClose={() => dispatch(setLaunchStrategy({ open: false }))}
        />
      ) : null}
      <Snackbar
        open={Boolean(localError?.length)}
        autoHideDuration={10000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {localError}
        </Alert>
      </Snackbar>
    </Box>
  );
}


export default Layout;

const LinkStyled = styled(Link)<{ isActive?: boolean }>(
  ({ theme, isActive }) => ({
    textDecoration: "auto",
    color: isActive ? theme.palette.primary.main : "unset",
    fontSize: "16px",
    whiteSpace: "nowrap",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  })
);
