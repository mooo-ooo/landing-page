import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'

import {
  Box,
  Typography,
  Dialog,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
} from '@mui/material'
import numeral from 'numeral'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import axios from 'axios'
import LoadingButton from '@mui/lab/LoadingButton'
import type { RootState } from '../../redux/store'
import type { SummaryBalanceState } from '../../redux/balances/balancesSlice'
import { useSnackbar } from 'notistack'
import SwapVertIcon from '@mui/icons-material/SwapVert';

export interface ConfirmationDialogRawProps {
  id: string
  keepMounted: boolean
  open: boolean
  onClose: (value?: string) => void
}

const exchanges = ['coinex', 'huobi', 'okx', 'bybit', 'gate', 'bitget']

function BalanceConfirmationDialog(props: ConfirmationDialogRawProps) {
  const balances = useSelector((state: RootState) => state.balances)
  const { onClose, open, ...other } = props
  const { enqueueSnackbar } = useSnackbar()
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(0)
  const [ggToken, setToken] = useState('')
  const [fromEx, setFromExchange] = useState('')
  const [toEx, setToExchange] = useState('')
  const [withdrawMap, setWithdrawMap] = useState<Record<string, string>>({})
  const [isTransferPending, setisTransferPending] = useState<boolean>(false)

  const handleCancel = () => {
    onClose()
  }

  const handleOk = async () => {
    setLoading(true)
    const { data } = await axios
      .post('/wallet/transfer', {
        from: fromEx.toLowerCase(),
        to: toEx.toLowerCase(),
        amount,
        ggToken,
      })
      .catch((err) => {
        enqueueSnackbar(err.response?.data?.error, { variant: 'error' })
        return {
          data: undefined,
        }
      })
    if (data) {
      enqueueSnackbar(
        `Withdrew to \n${
          data?.depositAddress?.address || toEx.toLowerCase()
        }, \ncheck tele for new updates`,
        { variant: 'success' }
      )
    }
    setAmount(0)
    setLoading(false)
    setToken('')
  }

  const handleResolveTransferPending = async () => {
    setLoading(true)
    const { data } = await axios
      .post('/wallet/transfer-pending', {
        status: false,
      })
    if (data) {
      setisTransferPending(data.isTransferPending)
      setLoading(false)
      enqueueSnackbar(
        `You now can do transfer again`,
        { variant: 'success' }
      )
    }
  }

  const fetchTransferPending = () => {
    setLoading(true)
    axios
      .get('/wallet/transfer-pending')
      .then(function ({ data }) {
        setisTransferPending(data.isTransferPending)
        setLoading(false)
      })
  }

  useEffect(() => {
    const fetchWitdrawMap = async () => {
      const { data } = await axios.get('/wallet/withdraw-map')
      setWithdrawMap(data)
    }
    fetchWitdrawMap()
    fetchTransferPending()
  }, [])

  const handleChangeFrom = (event: SelectChangeEvent) => {
    setFromExchange(event.target.value)
  }
  const handleChangeTo = (event: SelectChangeEvent) => {
    setToExchange(event.target.value)
  }

  const chainSelected = useMemo(() => {
    if (!fromEx || !toEx || !withdrawMap) {
      return null
    }
    return withdrawMap[`${fromEx}-${toEx}`]
  }, [fromEx, toEx, withdrawMap])

  const validEx =
    exchanges.includes(fromEx) && exchanges.includes(toEx) && fromEx !== toEx

  const selectedFromEx = fromEx
    ? balances[fromEx as unknown as keyof SummaryBalanceState]
    : null
  const selectedToEx = toEx
    ? balances[toEx as unknown as keyof SummaryBalanceState]
    : null
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
          <FormControl fullWidth sx={{ mb: 4 }}>
            {selectedFromEx ? (
              <Typography fontSize={14} variant="caption">
                Availale balance:&nbsp;
                {numeral(
                  (selectedFromEx as unknown as { future: { marginAvailable: number }, trading: { marginAvailable: number } })?.future?.marginAvailable ||
                    (selectedFromEx as unknown as { future: { marginAvailable: number }, trading: { marginAvailable: number } })?.trading?.marginAvailable
                ).format('0,0.0')}{' '}
                USDT
              </Typography>
            ) : (
              <Typography fontSize={14} variant="caption">
                From exchange
              </Typography>
            )}
            <Select value={fromEx} onChange={handleChangeFrom} displayEmpty>
              {exchanges.map((ex) => (
                <MenuItem disabled={ex === toEx} key={ex} value={ex}>
                  {ex}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 4 }}>
            {selectedToEx ? (
              <Typography fontSize={14} variant="caption">
                Availale balance: &nbsp;
                {numeral(
                  (selectedToEx as unknown as { future: { marginAvailable: number }, trading: { marginAvailable: number } })?.future?.marginAvailable ||
                    (selectedToEx as unknown as { future: { marginAvailable: number }, trading: { marginAvailable: number } })?.trading?.marginAvailable
                ).format('0,0.0')}{' '}
                USDT
              </Typography>
            ) : (
              <Typography fontSize={14} variant="caption">
                To exchange
              </Typography>
            )}
            <Select value={toEx} onChange={handleChangeTo} displayEmpty>
              {exchanges.map((ex) => (
                <MenuItem disabled={ex === fromEx} key={ex} value={ex}>
                  {ex}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {chainSelected ? (
            <Typography sx={{ mb: 4 }} fontSize={14} variant="caption">
              Chain: {chainSelected}
            </Typography>
          ) : null}
          <FormControl fullWidth sx={{ mb: 4 }}>
            <TextField
              fullWidth
              id="filled-number"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const val = Number(event.target.value)
                setAmount(val)
              }}
              label={`Amount`}
              type="number"
              value={amount || ''}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                step: '5',
                min: String(30),
              }}
              variant="standard"
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 4 }}>
            <TextField
              fullWidth
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setToken(event.target.value)
              }}
              label={`Fund password`}
              type="string"
              value={ggToken}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </FormControl>
          {isTransferPending ? <Button onClick={handleResolveTransferPending} disabled={!isTransferPending} variant="contained" endIcon={<SwapVertIcon />}>
            {isTransferPending ? 'Resolve' : 'All gud'}
          </Button> : null}
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
            onClick={handleOk}
            variant="contained"
            disabled={!ggToken || amount <= 0 || !validEx}
          >
            Transfer
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default BalanceConfirmationDialog

export const capitalize = (s: string) =>
  (s && s[0].toUpperCase() + s.slice(1)) || ''
