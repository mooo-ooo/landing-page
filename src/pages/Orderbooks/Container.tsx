import { lazy } from 'react'
import {
  Typography,
} from '@mui/material'
import { useScript } from '@uidotdev/usehooks'

const Orderbook = lazy(() => import('./index'))

const localCcxt = '/ccxt.browser.min.sat27.js'
const OrderBookContainer = () => {
  const status = useScript(localCcxt, {
    removeOnUnmount: false,
  })
  const isReady = status === 'ready'

  if (!isReady) {
    return (
      <Typography variant="caption" sx={{ fontSize: '10px' }}>
        Loading libaray
      </Typography>
    )
  }
  return <Orderbook />
}


export default OrderBookContainer
