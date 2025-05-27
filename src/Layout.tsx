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
  // IconButton
} from '@mui/material'
import { AccountCircle } from '@mui/icons-material'
import { styled } from '@mui/system'
import api from './lib/axios'

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const isMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user info
      api.get('/api/v1/auth/me')
        .then(response => {
          setUserEmail(response.data.email);
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

  const menuId = 'primary-search-account-menu';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>
        <Typography variant="body2" color="text.secondary">
          {userEmail}
        </Typography>
      </MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
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