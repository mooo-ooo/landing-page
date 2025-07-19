import { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Grid,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { percentageChange } from '../../helpers'

// Internal components
import BalanceConfirmationDialog from './BalanceConfirmationDialog'
import FilterDialog from './FilterDialog'
import Position from './Position'
import StrategyDialog from './StrategyDialog'

// Serives
import numeral from 'numeral'

// Store
import { useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import type { PostitionsState, IPosition } from '../../redux/positions/positionsSlice'

export const DEFAULT_PERCENT_CHANGE_TO_SL = 35

const changeFromMarkToLiq = ({ markPrice, liqPrice }: IPosition) =>
  Math.abs(percentageChange(markPrice, liqPrice))

function Positions() {
  const [openTransferDialog, setOpenTransferDialog] = useState<boolean>(false)
  const [openedFilter, setOpenedFilter] = useState<boolean>(false)
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([])
  const positionsStore = useSelector((state: RootState) => state.positions)

  const strategies = useSelector((state: RootState) => state.strategies)
  const balances = useSelector((state: RootState) => state.balances)
  const [selectedTokenStrategy, setSelectedTokenStrategy] = useState<string>()
  const [sortBy] = useState<string>('liquidation|asc')

  const exchanges: string[] = Object.keys(positionsStore).reduce(
    (acu: string[], exName) => {
      const exchange =
        positionsStore[exName as unknown as keyof PostitionsState]
      if (exchange.length) {
        const result = [...acu, exName]
        return result
      }
      return acu
    },
    []
  )

  const spotPositions: IPosition[] = useMemo(() => {
    return balances.gate.spot.map(({ coin, amount }) => ({
      exchange: 'gate',
      side: 'spot',
      size: amount,
      baseToken: coin.toUpperCase(),
      liqPrice: Number.NaN,
      avgPrice: Number.NaN,
      markPrice: 0,
      fundingRate: 0,
      liqPriceRatio: Number.NaN,
    }))
  }, [balances])

  const normalizePositions = () => {
    const posMap: Record<string, { buys: IPosition[]; sells: IPosition[] }> = {}
    const positions = Object.keys(positionsStore).reduce(
      (acu: IPosition[], exName) => {
        const exchange =
          positionsStore[exName as unknown as keyof PostitionsState]
        if (exchange.length) {
          const result = [
            ...acu,
            ...exchange.map((ex) => ({
              ...ex,
              exchange: exName,
            })),
          ]
          return result
        }
        return acu
      },
      []
    )
    positions.concat(spotPositions).forEach((pos) => {
      const inValidPositions: string[] = []
      if (!pos.markPrice && pos.side !== 'spot') {
        inValidPositions.push(pos.baseToken)
      }
      if (inValidPositions.includes(pos.baseToken)) {
        return
      }
      if (!posMap[pos.baseToken]) {
        posMap[pos.baseToken] = {
          buys: [],
          sells: [],
        }
      }
      if (pos.side === 'sell') {
        posMap[pos.baseToken].sells.push(pos)
      }
      if (['buy', 'spot'].includes(pos.side)) {
        posMap[pos.baseToken].buys.push(pos)
      }
    })

    return Object.keys(posMap)
      .map((baseToken) => {
        return {
          baseToken,
          ...posMap[baseToken],
        }
      })
      .filter(({ buys, sells }) => {
        if (!selectedExchanges?.length) {
          return true
        }
        const intersection = [...buys, ...sells]
          .map((ex) => ex.exchange)
          .filter((element) => selectedExchanges.includes(element))
        return intersection.length > 0
      })
      // .filter(({ baseToken }) => {
      //   return strategies.data.find(({ sellSymbol }) => {
      //     return sellSymbol.split('/')[0].toUpperCase() === baseToken
      //   })
      // })
      .filter(({ buys, sells }) => {
        const isSpotNotHedge = buys[0]?.side === 'spot' && sells.length === 0
        return !isSpotNotHedge
      })
  }

  const positions = normalizePositions()
  const getMaxLiq = useCallback((pos: (typeof positions)[0]) => {
    const maxShortFr = Math.max(...pos.sells.map(changeFromMarkToLiq))
    const maxLongFr = Math.max(...pos.buys.map(changeFromMarkToLiq))
    return Math.max(maxShortFr, maxLongFr)
  }, [])

  const getMinLiq = useCallback((pos: (typeof positions)[0]) => {
    const minShortFr = Math.min(...pos.sells.map(changeFromMarkToLiq))
    const minLongFr = Math.min(...pos.buys.map(changeFromMarkToLiq))
    return Math.min(minLongFr, minShortFr)
  }, [])

  const positionsSorted = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [direction] = sortBy.split('|')
    return positions.sort((a, b) => {
      if (direction === 'asc') {
        return getMinLiq(a) - getMinLiq(b)
      } else {
        return getMaxLiq(b) - getMaxLiq(a)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, sortBy])

  const estimatedFundingFee = positionsSorted
    .map(({ buys, sells }) => {
      return [...buys, ...sells]
    })
    .flat()
    .reduce((tot, cur) => {
      return (
        tot +
        cur.markPrice *
          cur.size *
          (cur.fundingRate || 0) *
          (cur.side === 'sell' ? 1 : -1)
      )
    }, 0)

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{
              position: 'sticky',
              top: '70px',
              zIndex: 1,
              paddingLeft: '12px'
            }}>
        <Typography
          sx={{ fontWeight: 'bold', fontSize: '0.85rem', marginRight: 1 }}
          variant="caption"
        >
          Estimated funding: {numeral(estimatedFundingFee).format('0,0.00')}{' '}
          USDT
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid>
          <Box display="flex" flexDirection="column" gap={2}>
            {positionsSorted.map((props) => {
              return (
                <Position
                  key={props.baseToken}
                  {...props}
                  setSelectedTokenStrategy={setSelectedTokenStrategy}
                />
              )
            })}
          </Box>
        </Grid>
      </Grid>

      {openTransferDialog ? (
        <BalanceConfirmationDialog
          id="ringtone-menu"
          keepMounted
          open={openTransferDialog}
          onClose={() => setOpenTransferDialog(false)}
        />
      ) : null}
      {openedFilter ? (
        <FilterDialog
          exchanges={exchanges}
          setSelectedExchanges={(exchanges: string[]) =>
            setSelectedExchanges(exchanges)
          }
          selectedExchanges={selectedExchanges}
          id="ringtone-menu"
          keepMounted
          open={openedFilter}
          onClose={() => setOpenedFilter(false)}
        />
      ) : null}
      {selectedTokenStrategy ? (
        <StrategyDialog
          strategies={strategies.data}
          token={selectedTokenStrategy}
          id="ringtone-menu"
          keepMounted
          open={Boolean(selectedTokenStrategy)}
          onClose={() => setSelectedTokenStrategy('')}
        />
      ) : null}
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          key="filter"
          icon={<FilterListIcon />}
          tooltipTitle="filter"
          onClick={() => setOpenedFilter(true)}
        />
        <SpeedDialAction
          key="transfer"
          icon={<SwapHorizIcon />}
          tooltipTitle="transfer"
          onClick={() => setOpenTransferDialog(true)}
        />
      </SpeedDial>
    </Box>
  )
}

export default Positions
