import { lazy } from 'react'
import {
  Typography,
} from '@mui/material'
import { useScript } from '@uidotdev/usehooks'

const Orderbook = lazy(() => import('./index'))


const OrderBookContainer = () => {
  const status = useScript(`http://178.128.110.139:7001/ccxt.browser.js`, {
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
