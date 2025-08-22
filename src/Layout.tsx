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
} from "@mui/material";
import {
  AccountCircle,
  VpnKey,
  Security,
  Logout,
  Email,
  ShowChart,
  MonetizationOn,
  ContentCopy,
  Group,
} from "@mui/icons-material";
import ReplayIcon from "@mui/icons-material/Replay";
import { styled } from "@mui/system";
import api from "./lib/axios";
import numeral from "numeral";
import NewStrategyDialog from "./components/StrategyDialog/NewStrategy";
import UpdateStrategy from "./components/StrategyDialog/UpdateStrategy";

import { setUser, setError } from "./redux/slices/userSlice";
import {
  setSummaryBalance,
  selectBalances,
  setBalancesError,
} from "./redux/balances/balancesSlice";
import {
  selectNewStrategy,
  setNewStrategy,
  setUpdateStrategy,
  selectUpdateStrategy
} from "./redux/strategy/strategySlice";
import {
  setPositions,
  setPositionsError,
  setPositionsLoading,
  selectPositionsLoading,
} from "./redux/positions/positionsSlice";
// import { setStrategies } from './redux/strategy/strategySlice'

function Layout() {
  const didRun = useRef(false);
  const initialized = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const newStrategyProps = useSelector(selectNewStrategy);
  const updateStrategyProps = useSelector(selectUpdateStrategy);
  const user = useSelector((state: RootState) => state.user.data);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [localError, setLocalError] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const [userCredit, setUserCredit] = useState<number>();
  const [userGroupCode, setUserGroupCode] = useState<string>();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const isMenuOpen = Boolean(anchorEl);
  const balances = useSelector(selectBalances);
  const positionLoading = useSelector(selectPositionsLoading);

  console.log({ newStrategyProps });
  const totalMargin = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );

  const fetchBalance = () => {
    setPositionsLoading(true);
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
            setUser({
              id: userData.id,
              email: userData.email,
              is2faEnabled: userData.two_factor_enabled,
              groupId: userData.groupId,
              groupCode: userData.groupCode,
            })
          );
          // Store groupId in localStorage for axios interceptor
          if (userData.groupId) {
            localStorage.setItem("groupId", userData.groupId.toString());
          }
          setUserEmail(userData.email);
          setUserCredit(userData.credit);
          setUserGroupCode(userData.groupCode);
          setTwoFactorEnabled(userData.two_factor_enabled);
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

  // Set x-group-id header when user data is available
  useEffect(() => {
    if (user?.groupId) {
      api.defaults.headers.common["x-group-id"] = user.groupId.toString();
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
    navigate("/login");
    handleMenuClose();
  };

  const handleCopyGroupCode = () => {
    if (userGroupCode) {
      navigator.clipboard.writeText(userGroupCode);
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
          <Typography variant="body1">{userEmail}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <MonetizationOn
            sx={{ mr: 2, fontSize: 20, color: "text.secondary" }}
          />
          <Typography variant="body1">
            {userCredit?.toFixed(2) || "0.00"}
          </Typography>
        </Box>

        {userGroupCode && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Group sx={{ mr: 2, fontSize: 20, color: "text.secondary" }} />
              <Typography variant="body1">{userGroupCode}</Typography>
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
          navigate("/api-keys");
        }}
        sx={{ py: 1.5 }}
      >
        <VpnKey sx={{ mr: 2, fontSize: 20 }} />
        API Keys
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
      <MenuItem
        onClick={() => {
          handleMenuClose();
          navigate("/equity");
        }}
        sx={{ py: 1.5 }}
      >
        <ShowChart sx={{ mr: 2, fontSize: 20 }} />
        Equity
      </MenuItem>
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <Logout sx={{ mr: 2, fontSize: 20 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <Box mt="60px">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed" sx={{ background: "#181a20" }}>
          <Toolbar>
            <Box display="flex" justifyContent="space-between" gap="36px">
              <img
                style={{ height: 18, marginRight: "12px" }}
                src="/logo.png"
                alt="logo"
              />
              <LinkStyled
                to="/dashboard"
                isActive={location.pathname === "/dashboard"}
              >
                Dashboard
              </LinkStyled>
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
                to="/tools"
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
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {userEmail ? (
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
        {renderMenu}
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
