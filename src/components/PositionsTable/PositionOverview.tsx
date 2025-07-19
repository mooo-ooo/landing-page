import { Box, Typography } from '@mui/material'
import { GridStyled } from './styleds'
import numeral from 'numeral'
import { percentageChange } from '../../helpers'
import { PiLineVerticalThin } from 'react-icons/pi'
import type { IPosition } from '../../redux/positions/positionsSlice'

const PositionOverview = (props: IPosition) => {
  const {
    exchange,
    size,
    fundingRate,
    side,
    baseToken,
    liqPrice,
    markPrice,
    tpPrice,
    slPrice
  } = props
  return (
    <Box>
      <GridStyled container spacing={2}>
        <GridStyled size={{ xs: 4 }}>
          <Box display="flex" alignItems="center">
            <Typography
              sx={{
                color:
                  side !== 'sell' ? 'rgb(14, 203, 129)' : 'rgb(246, 70, 93)',
                mr: 1,
              }}
              variant="caption"
            >
              {exchange.toUpperCase()}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '10px' }}>
              {side === 'spot'
                ? '[Spot]'
                : `[${numeral(fundingRate * 100).format('0,0.0[00]')}%]`}
            </Typography>
          </Box>
        </GridStyled>

        {/* QUANTITY */}
        <GridStyled size={{ xs: 4 }}>
          <Typography variant="caption" textTransform="capitalize">
            {formatQuantity(size)}
          </Typography>
        </GridStyled>
        <GridStyled size={{ xs: 4 }}>
          <Box display="flex" justifyContent="space-between" width="100%">
            <Typography
              align="right"
              width="100%"
              variant="caption"
              textTransform="capitalize"
            >
              {numeral(markPrice).format(
                precisionMap[baseToken] || '0,0.[0000]'
              )}
            </Typography>
          </Box>
        </GridStyled>
      </GridStyled>
      <Box height={12} />
      <Box>
        {slPrice || tpPrice ? (
          <GridStyled container spacing={2}>
            <GridStyled size={{ xs: 4 }}>
              <Typography fontSize={12} variant="caption">
                SL/TP
              </Typography>
            </GridStyled>
            <GridStyled size={{ xs: 4 }}>
              <Typography color="rgb(246, 70, 93)" variant="caption">
                {numeral(percentageChange(markPrice, slPrice || 0)).format('0')}
                %
              </Typography>
              <PiLineVerticalThin />
              <Typography color="rgb(14, 203, 129)" variant="caption">
                {numeral(percentageChange(markPrice, tpPrice || 0)).format('0')}
                %
              </Typography>
            </GridStyled>
            <GridStyled
              size={{ xs: 4 }}
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <Typography width="100%" align="right" variant="caption">
                {numeral(slPrice).format(
                  precisionMap[baseToken] || '0,0.[0000]'
                )}
              </Typography>
            </GridStyled>
          </GridStyled>
        ) : null}

        {side !== 'spot' ? (
          <GridStyled container spacing={2}>
            <GridStyled size={{ xs: 4 }}>
              <Typography fontSize={12} variant="caption">
                Liq.Price
              </Typography>
            </GridStyled>
            <GridStyled size={{ xs: 4 }}>
              <Typography variant="caption">
                {numeral(percentageChange(markPrice, liqPrice || 0)).format(
                  '0'
                )}
                %
              </Typography>
            </GridStyled>
            <GridStyled size={{ xs: 4 }}>
              <Typography width="100%" align="right" variant="caption">
                {liqPrice
                  ? numeral(liqPrice).format(
                      precisionMap[baseToken] || '0,0.[00]'
                    )
                  : 'N/A'}
              </Typography>
            </GridStyled>
          </GridStyled>
        ) : null}
      </Box>
    </Box>
  )
}

export default PositionOverview

const precisionMap: Record<string, string> = {
  SHIB: '0.0000e+0',
  DOGE: '0,0.0[0000]',
  AVAX: '0,0.00',
  ETC: '0.000',
  SUI: '0,0.000',
}

const nFormatter = (num: number, digits: number) => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ]
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value)
  return item
    ? (num / item.value).toFixed(digits).replace(regexp, '').concat(item.symbol)
    : '0'
}

const formatQuantity = (qty: number) => {
  if (qty > 1000000) {
    return nFormatter(qty, 0)
  }
  return numeral(qty).format('0,0.[000]')
}
