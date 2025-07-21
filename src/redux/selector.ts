import { useSelector } from 'react-redux'
import type { RootState } from '../redux/store'

export const useBalances = () => {
  const { okx, huobi, gate, coinex, bybit, bitget } = useSelector(
    (state: RootState) => state.balances
  )
  const positions = useSelector((state: RootState) => state.positions)
  
    const {
      okx: okxPos,
      huobi: huobiPos,
      gate: gatePos,
      coinex: coinexPos,
      bybit: bybitPos,
      bitget: bitgetPos
    } = positions
  
    const totalVol = [
      ...okxPos,
      ...huobiPos,
      ...gatePos,
      ...coinexPos,
      ...bybitPos,
      ...bitgetPos
    ].reduce((tot, { size, markPrice }) => {
      return tot + size * markPrice
    }, 0)

    const totalEquity =
    huobi?.total + gate?.total + okx?.total + coinex?.total + bybit?.total + bitget?.total
    return {
      totalEquity,
      totalVol,
      leverage: totalVol / totalEquity
    }
};