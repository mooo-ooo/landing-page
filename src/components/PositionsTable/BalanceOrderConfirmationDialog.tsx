import { useState } from 'react'

import {
  Box,
  Dialog,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  FormLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
} from '@mui/material'
import FormControl from '@mui/material/FormControl'
import axios from 'axios'
import LoadingButton from '@mui/lab/LoadingButton'
import { useSnackbar } from 'notistack'
import type { SIDE } from '../../types'

export interface ConfirmationDialogRawProps {
  id: string
  sideBalance: SIDE
  keepMounted: boolean
  open: boolean
  token: string
  buyExchange: string
  sellExchange: string
  amount: number
  onClose: (value?: string) => void
}

function BalanceOrderConfirmationDialog(props: ConfirmationDialogRawProps) {
  const { amount, token, sellExchange, buyExchange, sideBalance } = props
  const { onClose, open, ...other } = props
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState('increase')
  const [password, setPassword] = useState('')

  const handleCancel = () => {
    onClose()
  }

  const handleBalance = async () => {
    setLoading(true)
    const exchange = direction === 'reduce' ? reduceExchange : increaseExchange
    axios
      .post('/positions/imbalance', {
        exchange,
        quantity: amount,
        side: sideBalance,
        symbol: `${token}/USDT:USDT`,
        password
      })
      .then(() =>
        enqueueSnackbar(
          `Placed market order: ${sideBalance} ${amount} ${token} [${exchange}]`,
          { variant: 'success' }
        )
      )
      .catch((err) => {
        console.log(err)
        enqueueSnackbar(err.response?.data?.error || err.message, {
          variant: 'error',
        })
        return {
          data: undefined,
        }
      })
      .finally(() => setLoading(false))
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDirection((event.target as HTMLInputElement).value)
  }

  const increaseExchange = sideBalance === 'sell' ? sellExchange : buyExchange
  const reduceExchange = sideBalance !== 'sell' ? sellExchange : buyExchange

  return (
    <Dialog
      fullScreen
      // sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
      maxWidth="xl"
      open={open}
      {...other}
    >
      <DialogTitle sx={{ fontSize: 16 }}>Balance positions</DialogTitle>
      <DialogContent dividers sx={{ padding: '16px 12px' }}>
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          flexDirection="column"
        >
          <FormControl>
            <FormLabel id="demo-radio-buttons-group-label">
              {amount} {token}
            </FormLabel>
            <RadioGroup
              value={direction}
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="sell"
              name="radio-buttons-group"
              onChange={handleChange}
            >
              {increaseExchange ? (
                <FormControlLabel
                  value="increase"
                  control={<Radio />}
                  label={`${sideBalance} ${increaseExchange} (Increase)`}
                />
              ) : null}
              {reduceExchange ? (
                <FormControlLabel
                  value="reduce"
                  control={<Radio />}
                  label={`${sideBalance} ${reduceExchange} (Reduce)`}
                />
              ) : null}
            </RadioGroup>
          </FormControl>
        </Box>
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ width: '100%' }}>
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          py={1}
        >
          <Button autoFocus onClick={handleCancel}>
            Cancel
          </Button>
          <LoadingButton
            loading={loading}
            onClick={handleBalance}
            variant="contained"
          >
            Place Order
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default BalanceOrderConfirmationDialog

export const capitalize = (s: string) =>
  (s && s[0].toUpperCase() + s.slice(1)) || ''
