import { useSelector } from 'react-redux'
import { selectPositions } from './positions/positionsSlice'
import { selectBalances } from './balances/balancesSlice'

export const useBalances = () => {
  const balances = useSelector(selectBalances)
  const positions = useSelector(selectPositions)
    const totalVol = Object.values(positions).reduce((tot, { size, markPrice }) => {
      return tot + size * markPrice
    }, 0)

    const totalEquity = Object.values(balances).reduce((tot, { total }) => {
      return tot + total
    }, 0)
    return {
      totalEquity,
      totalVol,
      leverage: totalVol / totalEquity
    }
};