import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  ListItem,
  List,
  ListItemButton,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { styled } from '@mui/system'

function Layout() {
  const [error, setError] = useState<string>()
  const [open, setOpen] = useState(false)

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen)
  }

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }

    setError(undefined)
  }

  const [, setOpenLoginDialog] = useState(false)

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        <ListItem disablePadding>
          <LinkStyled to="/">
            <ListItemButton>
              <Typography variant="button">Dashboard</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/orderbooks">
            <ListItemButton>
              <Typography variant="button">Orderbooks</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/wallet-addresses">
            <ListItemButton>
              <Typography variant="button">Wallet Addresses</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/funding-arbitrage">
            <ListItemButton>
              <Typography variant="button">Funding Arbitrage</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/positions">
            <ListItemButton>
              <Typography variant="button">Positions</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/authenticator">
            <ListItemButton>
              <Typography variant="button">Authenticator</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <LinkStyled to="/logs">
            <ListItemButton>
              <Typography variant="button">Logs</Typography>
            </ListItemButton>
          </LinkStyled>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton onClick={() => setOpenLoginDialog(true)}>
            <Typography variant="button">Login</Typography>
          </ListItemButton>
          {/* <Button color="inherit" onClick={() => setOpenLoginDialog(true)}>Login</Button> */}
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box mt="60px">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} display="flex" justifyContent="center">
              <img style={{ height: 16 }} src="/logo.png" alt="logo" />
            </Box>
          </Toolbar>
        </AppBar>
      </Box>
      <Drawer open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
      </Drawer>
      {/* An <Outlet> renders whatever child route is currently active,
          so you can think about this <Outlet> as a placeholder for
          the child routes we defined above. */}
      <Container maxWidth="xl">
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

const LinkStyled = styled(Link)({
  textDecoration: 'auto',
  color: 'unset',
  width: '100%',
})