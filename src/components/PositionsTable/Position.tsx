import { useState } from 'react'
import {
  Box,
  Card,
  Typography,
  CardContent,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Button
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory'
import type { SIDE } from '../../types'

// Services
import numeral from 'numeral'
import { percentageChange, strip } from '../../helpers'

// Internal components
import PositionOverview from './PositionOverview'
import { GridStyled } from './styleds'
import BalanceOrderConfirmationDialog from './BalanceOrderConfirmationDialog'

import type { IPosition } from '../../redux/positions/positionsSlice'

const Position = (props: {
  buys: IPosition[]
  sells: IPosition[]
  baseToken: string
  setSelectedTokenStrategy: (token: string) => void
}) => {
  const [shownBalanceOrderConfirmationDialog, setShownBalanceOrderConfirmationDialog] = useState<boolean>(false)
  const { sells, buys, baseToken, setSelectedTokenStrategy } = props

  const volSell = sells.reduce(
    (tot, { markPrice, size }) => markPrice * size + tot,
    0
  )
  const totalSizeSell = sells.reduce((tot, { size }) => size + tot, 0)
  const totalSizeBuy = buys.reduce((tot, { size }) => size + tot, 0)

  const spreadSize = Math.abs(strip(String(totalSizeSell)) - strip(String(totalSizeBuy)))

  const estimatedFundingFee = [...sells, ...buys].reduce((tot, cur) => {
    return (
      tot +
      cur.markPrice *
        cur.size *
        cur.fundingRate *
        (cur.side === 'sell' ? 1 : -1)
    )
  }, 0)

  const disabledDetails = [...sells, ...buys].find(
    ({ side }) => side === 'spot'
  )

  const sideBalance: SIDE = Math.abs(totalSizeSell) < Math.abs(totalSizeBuy) ? 'sell' : 'buy'

  return (
    <Card id={baseToken} key={baseToken} sx={{ scrollMarginTop: 50 }}>
      <CardContent
        sx={{ padding: '12px', '&:last-child': { paddingBottom: 1 } }}
      >
        <GridStyled container spacing={2}>
          <GridStyled>
            <Box display="flex" alignItems="center">
              <Typography
                sx={{ fontWeight: 'bold', marginRight: 1 }}
                variant="caption"
              >
                {baseToken}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontSize: '10px', marginRight: 1 }}
              >
                ~${numeral(volSell * 2).format('0,0')}
              </Typography>
            </Box>
          </GridStyled>
          <GridStyled size={{ xs: 4 }}>
            <Box display="flex" alignItems="center">
              <Typography
                variant="caption"
                textTransform="capitalize"
                gutterBottom
                sx={{ marginRight: 1 }}
              >
                Qty
              </Typography>
              {spreadSize !== 0 ? (
                <Button size='small' color="error" onClick={() => setShownBalanceOrderConfirmationDialog(true)}>
                    [{numeral(spreadSize).format('0,0.[000]')}]
                </Button>
              ) : null}
            </Box>
          </GridStyled>
          <GridStyled size={{ xs: 4 }}>
            <Typography
              variant="caption"
              textTransform="capitalize"
              align="right"
              width="100%"
              gutterBottom
            >
              M.Price
            </Typography>
          </GridStyled>
        </GridStyled>
        {sells.map((props) => (
          <PositionOverview key={props.baseToken + props.exchange} {...props} />
        ))}
        <Divider sx={{ my: 2 }} />
        {buys.map((props) => (
          <PositionOverview key={props.baseToken + props.exchange} {...props} />
        ))}

        <Box height={12} />
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            sx={{
              minHeight: '48px !important',
              height: 30,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              px: 1,
            }}
          >
            <Typography variant="caption">
              Est.fee: {numeral(estimatedFundingFee).format('0.[00]')} USDT
            </Typography>
          </AccordionSummary>
          {!disabledDetails ? (
            <AccordionDetails sx={{ px: 1 }}>
              <Box
                my="12px"
                display="flex"
                width="100%"
                justifyContent="space-between"
              >
                <Typography textTransform="capitalize" variant="caption">
                  Unrealized.Pnl (
                  {(sells[0]?.unrealizedPnl || 0) < (buys[0]?.unrealizedPnl || 0)
                    ? buys[0]?.exchange
                    : sells[0]?.exchange}
                  )
                </Typography>
                <Typography textTransform="capitalize" variant="caption">
                  {numeral(
                    Math.max(
                      sells[0]?.unrealizedPnl || 0,
                      buys[0]?.unrealizedPnl || 0
                    )
                  ).format('0,0')}{' '}
                  USDT
                </Typography>
              </Box>
              <Box display="flex" width="100%" justifyContent="space-between">
                <Typography textTransform="capitalize" variant="caption">
                  %Premium
                </Typography>
                <Typography textTransform="capitalize" variant="caption">
                  {numeral(
                    percentageChange(buys[0]?.avgPrice, sells[0]?.avgPrice)
                  ).format('0.[000]')}
                  %
                </Typography>
              </Box>
              {/* <Divider sx={{ my: 2 }} /> */}
              {/* <Box>
                <StopLossAndTakeProfit
                  {...props}
                  spreadRatio={spreadRatio}
                  setSpreadRatio={setSpreadRatio}
                />
              </Box> */}
              <Divider sx={{ my: 2 }} />
              <Box
                display="flex"
                width="100%"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography textTransform="capitalize" variant="caption">
                  Strategy
                </Typography>
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="open drawer"
                  onClick={() => setSelectedTokenStrategy(baseToken)}
                >
                  <ManageHistoryIcon />
                </IconButton>
              </Box>
            </AccordionDetails>
          ) : null}
        </Accordion>
        {shownBalanceOrderConfirmationDialog ? (
        <BalanceOrderConfirmationDialog
          id="ringtone-menu"
          sideBalance={sideBalance}
          keepMounted
          buyExchange={buys[0]?.exchange}
          sellExchange={sells[0]?.exchange}
          open={shownBalanceOrderConfirmationDialog}
          token={baseToken}
          amount={spreadSize}
          onClose={() => setShownBalanceOrderConfirmationDialog(false)}
        />
      ) : null}
      </CardContent>
    </Card>
  )
}

export default Position
