import {
  Box,
  Typography,
  IconButton,
  ListItem,
  ListItemText,
  List,
  Divider,
  TextField,
  Button,
  Switch,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState, useEffect, Fragment } from 'react'
import axios from 'axios'
import { BASE_URL } from '../config'
import { useSnackbar } from 'notistack'

interface IOTP {
  code: string
  label: string
}

const getAlias = () => {
  try {
    return JSON.parse(localStorage.getItem('alias') || '')
  } catch {
    localStorage.removeItem('alias')
    return {}
  }
}

const localAlias: Record<string, string> = getAlias()
function Authenticator() {
  const { enqueueSnackbar } = useSnackbar()
  const [codes, setCodes] = useState<IOTP[]>([])
  const [editMode, setEditMode] = useState<boolean>(false)
  const [isLogged, setIsLogged] = useState<boolean>(false)
  const [password, setPassword] = useState('')
  const [alias, setAlias] = useState<Record<string, string>>(localAlias)

  useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
      const d = new Date()
      const seconds = d.getSeconds()
      if (seconds === 30 || seconds === 0) {
        fetchAuthenticator()
      }
    }, 1000)

    //Clearing the interval
    return () => clearInterval(interval)
  }, [])

  const submit = async () => {
    const token = localStorage.getItem('token')
    const options = {
      data: {
        password,
      },
      method: 'POST',
      headers: {
        Authorization: token,
      },
      url: `${BASE_URL}/api/v1/0tp/2fa-login`,
    }
    const {
      data: { data },
    } = await axios(options)
    console.log(data)
    localStorage.setItem('tokenOtp', data)
    setIsLogged(true)
    fetchAuthenticator()
  }

  const updateAlias = () => localStorage.setItem('alias', JSON.stringify(alias))

  const fetchAuthenticator = async () => {
    try {
      const token = localStorage.getItem('tokenOtp')
      const { data: { data } } = await axios({
        method: 'get',
        url: `${BASE_URL}/api/v1/0tp`,
        headers: {
          Authorization: token,
        },
      })
      setCodes(data)
      setIsLogged(true)
    } catch {
      setIsLogged(false)
    }
  }
  useEffect(() => {
    fetchAuthenticator()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isLogged) {
    return (
      <Box
        height="300px"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <TextField
          onChange={(e) => setPassword(e.target.value)}
          id="standard-basic"
          label="password"
          variant="standard"
        />
        <Button onClick={submit}>Login</Button>
      </Box>
    )
  }

  return (
    <Box py={2}>
      <Typography color="orangered">TOP SECRET</Typography>

      <List>
        {codes?.map(({ label, code }) => {
          return (
            <Fragment key={code}>
              <ListItem
                disablePadding
                secondaryAction={
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(code)
                      enqueueSnackbar(`Copy ${label}`, { variant: 'success' })
                    }}
                    color="primary"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={code}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ color: 'text.primary', display: 'inline' }}
                      >
                        {localAlias[label] ? localAlias[label] : label}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {editMode ? (
                <Box>
                  <TextField
                    fullWidth
                    onChange={(e) => {
                      setAlias({
                        ...alias,
                        [label]: e.target.value,
                      })
                    }}
                    id="standard-basic"
                    label="Alias"
                    variant="standard"
                  />
                </Box>
              ) : null}
              <Divider />
            </Fragment>
          )
        })}
      </List>
      <Box display='flex' alignItems='center'>
        <Switch
          checked={editMode}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setEditMode(event.target.checked)
          }
          inputProps={{ 'aria-label': 'controlled' }}
        />
        <Typography>Edit Mode</Typography>
      </Box>

      {editMode ? <Button variant='contained' onClick={updateAlias}>Update Alias</Button> : null}
    </Box>
  )
}

export default Authenticator
