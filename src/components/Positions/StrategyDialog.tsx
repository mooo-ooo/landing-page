import { useState } from 'react'
import {
  Box,
  Drawer,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  Checkbox,
  TextField,
  Typography,
} from '@mui/material'
import type { IStrategy } from '../../redux/strategy/strategySlice'
import LoadingButton from '@mui/lab/LoadingButton'
import axios from 'axios'
import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux'
import { setStrategies } from '../../redux/strategy/strategySlice'

export interface StrategyDialogProps {
  token: string
  id: string
  keepMounted: boolean
  open: boolean
  onClose: (value?: string) => void
  strategies: IStrategy[]
}

function StrategyDialog(props: StrategyDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch()
  const [loading, setLoading] = useState<boolean>(false)
  const { onClose, open, token, strategies, ...other } = props
  const foundStrategy = strategies.find(({ sellSymbol, strategyName }) => {
    return sellSymbol.split('/')[0].toUpperCase() === token && strategyName.toUpperCase() === token.toUpperCase()
  })
  const [strategy, setStrategy] = useState<IStrategy | object>({})
  const handleCancel = () => {
    onClose()
  }

  if (!strategy) {
    return (
      <Typography fontSize={14} variant="caption" gutterBottom>
        Not found Stratey {token}
      </Typography>
    )
  }
  const {
    strategyName,
    sellSymbol,
    buySymbol,
    buyExchange,
    sellExchange,
    requiredOrderVol,
    bestInSpread,
    bestOutSpread,
    secondInSpread,
    secondOutSpread,
    maxVolOfPosition,
    maxOrderVol,
    isIncrease,
    isReduce,
  } = {
    ...foundStrategy,
    ...strategy
  }

  const handleSave = async () => {
    setLoading(true)
    await axios.patch('/positions/strategies', {
      buySymbol,
      sellSymbol,
      ...foundStrategy,
      ...strategy
    }).catch(err => {
      enqueueSnackbar(err.response?.data?.error, { variant: 'error' });
    })
    axios
        .get('/positions/strategies')
        .then(function ({ data }) {
          dispatch(setStrategies(data))
        })
    setStrategy({})
    enqueueSnackbar('Strategy was saved', { variant: 'success' })
    setLoading(false)
  }
  return (
    <Drawer anchor="right" open={open} {...other} onClose={() => onClose()}>
      <DialogTitle sx={{ fontSize: 16 }}>Strategy {strategyName}</DialogTitle>
      <DialogContent dividers sx={{ padding: '16px 12px' }}>
        <Box display="flex" flexDirection="column" gap="16px">
          <Box display="flex" justifyContent="space-between">
            <Typography fontSize={14} variant="caption" gutterBottom>
              Sell symbol
            </Typography>
            <Typography fontSize={14} gutterBottom>
              {sellSymbol}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography fontSize={14} variant="caption" gutterBottom>
              Buy symbol
            </Typography>
            <Typography fontSize={14} gutterBottom>
              {buySymbol}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography fontSize={14} variant="caption" gutterBottom>
              Sell exchange
            </Typography>
            <Typography textTransform="capitalize" fontSize={14} gutterBottom>
              {sellExchange}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography fontSize={14} variant="caption" gutterBottom>
              Buy exchange
            </Typography>
            <Typography textTransform="capitalize" fontSize={14} gutterBottom>
              {buyExchange}
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Max volumn of position
            </Typography>
            <TextField
              sx={{ width: '30%' }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  maxVolOfPosition: Number(event.target.value),
                })
              }}
              type="number"
              value={maxVolOfPosition}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Volumn required
            </Typography>
            <TextField
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  requiredOrderVol: Number(event.target.value),
                })
              }}
              type="number"
              value={requiredOrderVol}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
              sx={{ width: '30%' }}
            />
          </Box>
          
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Max volumn of order
            </Typography>
            <TextField
              sx={{ width: '30%' }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  maxOrderVol: Number(event.target.value),
                })
              }}
              type="number"
              value={maxOrderVol}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Best in spread
            </Typography>
            <TextField
              sx={{ width: '30%' }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  bestInSpread: Number(event.target.value),
                })
              }}
              type="number"
              value={bestInSpread}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Second in spread
            </Typography>
            <TextField
              sx={{ width: '30%' }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  secondInSpread: Number(event.target.value),
                })
              }}
              type="number"
              value={secondInSpread}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Best out spread
            </Typography>
            <TextField
              sx={{ width: '30%' }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  bestOutSpread: Number(event.target.value),
                })
              }}
              type="number"
              value={bestOutSpread}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Second out spread
            </Typography>
            <TextField
              sx={{ width: '30%' }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setStrategy({
                  ...strategy,
                  secondOutSpread: Number(event.target.value),
                })
              }}
              type="number"
              value={secondOutSpread}
              InputLabelProps={{
                shrink: true,
              }}
              variant="standard"
            />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Increase
            </Typography>
            <Checkbox
                checked={isIncrease}
                name='pauseIn'
                onChange={(_, checked) => {
                  setStrategy({
                    ...strategy,
                    isIncrease: checked,
                  })
                }}
                inputProps={{ 'aria-label': 'controlled' }}
              />
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
          >
            <Typography fontSize={14} variant="caption">
              Reduce
            </Typography>
            <Checkbox
                checked={isReduce}
                name='pauseOut'
                onChange={(_, checked) => {
                  setStrategy({
                    ...strategy,
                    isReduce: checked,
                  })
                }}
                inputProps={{ 'aria-label': 'controlled' }}
              />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ width: '100%' }}>
        <Box
          width="100%"
          display="flex"
          alignItems="flex-end"
          justifyContent="space-between"
          py={1}
        >
          <Button autoFocus onClick={handleCancel}>
            Close
          </Button>
          <LoadingButton
            loading={loading}
            onClick={handleSave}
            variant="contained"
            disabled={loading}
          >
            Update
          </LoadingButton>
        </Box>
      </DialogActions>
    </Drawer>
  )
}

export default StrategyDialog