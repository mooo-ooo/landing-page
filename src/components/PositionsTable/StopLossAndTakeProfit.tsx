import { useState } from 'react'
import { Box, Typography, IconButton } from '@mui/material'
import { BiTransfer } from 'react-icons/bi'
import { useSnackbar } from 'notistack';

// Services
import axios from 'axios'
import { getPrecision } from 'helpers'

// Internal components
import { GridStyled, GradientCircularProgress } from './styleds'

// Store
import { useDispatch } from 'react-redux'
import { IPosition, setPositions } from '../../redux/positions/positionsSlice'

interface IPositionWithEx extends IPosition {
  exchange: string
}

const StopLossAndTakeProfit = ({
  sells,
  buys,
  baseToken,
  spreadRatio,
  setSpreadRatio,
}: {
  buys: IPositionWithEx[]
  sells: IPositionWithEx[]
  baseToken: string
  spreadRatio: number
  setSpreadRatio: (num: number) => void
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false)
  const dispatch = useDispatch()

  const markPrice = sells[0]?.markPrice

  const precision = Math.min(
    ...[
      ...sells.map(({ markPrice }) => getPrecision(markPrice)),
      ...buys.map(({ markPrice }) => getPrecision(markPrice)),
    ]
  )

  const toPrecision = (n: number) => Number(n.toFixed(precision))

  const sellSL = toPrecision(markPrice * (1 + spreadRatio))
  const sellTP = toPrecision(markPrice / (1 + spreadRatio))

  const buySL = sellTP
  const buyTP = sellSL

  const updateAlgoOrders = async () => {
    if (sellTP >= sellSL || sellTP <= 0 || sellSL <= 0) {
      enqueueSnackbar('SL/TP is not valid', { variant: 'error' })
      return
    }
    setLoading(true)
    await axios.post('/orders', {
      baseToken,
      sells: sells.map(({ exchange }) => exchange),
      buys: buys.map(({ exchange }) => exchange),
      slPrice: buySL,
      tpPrice: buyTP,
    })
    axios.get('/positions').then(function ({ data }) {
      // handle success
      dispatch(setPositions(data))
      setLoading(false)
    })
    enqueueSnackbar('SL/TP was updated', { variant: 'success' })
  }

  return (
    <>
      <GridStyled container spacing={2}>
        <GridStyled xs={4}>
          <Typography fontSize={12} variant="caption">
            Exchange
          </Typography>
        </GridStyled>
        <GridStyled xs={4}>
          <Typography fontSize={12} variant="caption">
            Stoploss
          </Typography>
        </GridStyled>
        <GridStyled xs={4}>
          <Typography
            fontSize={12}
            width="100%"
            align="right"
            variant="caption"
          >
            Takeprofit
          </Typography>
        </GridStyled>
      </GridStyled>
      {sells.map(({ exchange }) => (
        <GridStyled key={exchange} container spacing={2}>
          <GridStyled xs={4}>
            <Typography textTransform="capitalize" variant="caption">
              {exchange}
            </Typography>
          </GridStyled>
          <GridStyled xs={4}>
            <Typography variant="caption">{sellSL}</Typography>
          </GridStyled>
          <GridStyled xs={4}>
            <Typography width="100%" align="right" variant="caption">
              {sellTP}
            </Typography>
          </GridStyled>
        </GridStyled>
      ))}
      {buys.map(({ exchange }) => (
        <GridStyled key={exchange} container spacing={2}>
          <GridStyled xs={4}>
            <Typography textTransform="capitalize" variant="caption">
              {exchange}
            </Typography>
          </GridStyled>
          <GridStyled xs={4}>
            <Typography variant="caption">{buySL}</Typography>
          </GridStyled>
          <GridStyled xs={4}>
            <Typography width="100%" align="right" variant="caption">
              {buyTP}
            </Typography>
          </GridStyled>
        </GridStyled>
      ))}
      <Box
        mt="12px"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box display="flex" alignItems="center">
          <Typography width="100%" align="right" variant="caption">
            {`Update SL ${(spreadRatio * 100).toFixed(0)}%`}
          </Typography>
        </Box>
        <IconButton
          color="primary"
          disabled={loading}
          onClick={updateAlgoOrders}
          size="large"
        >
          {loading ? <GradientCircularProgress width="18px" /> : <BiTransfer />}
        </IconButton>
      </Box>
    </>
  )
}

export default StopLossAndTakeProfit
