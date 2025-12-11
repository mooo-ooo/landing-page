import { lazy } from 'react'
import {
  Typography,
} from '@mui/material'
import { useScript } from '@uidotdev/usehooks'

const Orderbook = lazy(() => import('./index'))


const OrderBookContainer = () => {
  const status = useScript(`/ccxt.browser.js`, {
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
