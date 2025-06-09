import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  // Typography,
  Snackbar,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  // IconButton
} from '@mui/material'
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
} from '@mui/icons-material'
import { styled } from '@mui/system'
import api from './lib/axios'

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const [userCredit, setUserCredit] = useState<number>();
  const [userGroupCode, setUserGroupCode] = useState<string>();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user info
      api.get('/api/v1/auth/me')
        .then(response => {
          setUserEmail(response.data.email);
          setUserCredit(response.data.credit);
          setUserGroupCode(response.data.groupCode);
          setTwoFactorEnabled(response.data.two_factor_enabled);
        })
        .catch(() => {
          // If token is invalid, clear it and redirect to login
          localStorage.removeItem('token');
          navigate('/login');
        });
    }
  }, [navigate]);

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }

    setError(undefined)
  }

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    handleMenuClose();
  };

  const handleCopyGroupCode = () => {
    if (userGroupCode) {
      navigator.clipboard.writeText(userGroupCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const menuId = 'primary-search-account-menu';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
      PaperProps={{
        sx: {
          padding: '0px',
          minWidth: '200px',
        }
      }}
    >
      <Box
        sx={{
          py: 2,
          px: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Email sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="body1">
            {userEmail}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MonetizationOn sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="body1">
            {userCredit?.toFixed(2) || '0.00'}
          </Typography>
        </Box>

        {userGroupCode && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Group sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body1">
                {userGroupCode}
              </Typography>
            </Box>
            <Tooltip title={copySuccess ? "Copied!" : "Copy to clipboard"}>
              <IconButton 
                onClick={handleCopyGroupCode}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
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
          navigate('/api-keys');
        }}
        sx={{ py: 1.5 }}
      >
        <VpnKey sx={{ mr: 2, fontSize: 20 }} />
        API Keys
      </MenuItem>
      <MenuItem 
        onClick={() => {
          handleMenuClose();
          navigate('/2fa');
        }}
        sx={{ 
          py: 1.5,
          color: !twoFactorEnabled ? 'warning.main' : 'inherit',
          '&:hover': {
            backgroundColor: !twoFactorEnabled ? 'warning.dark' : undefined,
          }
        }}
      >
        <Security sx={{ mr: 2, fontSize: 20 }} />
        2FA Setup
        {!twoFactorEnabled && (
          <Typography 
            variant="caption" 
            sx={{ 
              ml: 1, 
              color: 'warning.main',
              fontWeight: 'bold'
            }}
          >
            (Required)
          </Typography>
        )}
      </MenuItem>
      <MenuItem 
        onClick={() => {
          handleMenuClose();
          navigate('/equity');
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
  )
  

  return (
    <Box mt="60px">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed" sx={{background: "#181a20"}}>
          <Toolbar>
            <Box display="flex" justifyContent="space-between" gap="36px">
              <img style={{ height: 18, marginRight: '12px' }} src="/logo.png" alt="logo" />
              <LinkStyled
                to="/dashboard"
                isActive={location.pathname === '/dashboard'}
              >
                Dashboard
              </LinkStyled>
              <LinkStyled
                to="/funding-arbitrage"
                isActive={location.pathname === '/funding-arbitrage'}
              >
                Funding Arbitrage
              </LinkStyled>
              <LinkStyled
                to="/tools"
                isActive={location.pathname === '/tools'}
              >
                Tools
              </LinkStyled>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              {userEmail ? (
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
              ) : (
                <LinkStyled to="/login">Login</LinkStyled>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        {renderMenu}
      </Box>
      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
      <Container id="content-layout" maxWidth="xl">
        <Outlet />
      </Container>
      <Snackbar
        open={Boolean(error?.length)}
        autoHideDuration={10000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Layout

const LinkStyled = styled(Link)<{ isActive?: boolean }>(({ theme, isActive }) => ({
  textDecoration: 'auto',
  color: isActive ? theme.palette.primary.main : 'unset',
  fontSize: '16px',
  whiteSpace: 'nowrap',
  '&:hover': {
    color: theme.palette.primary.main
  }
}))