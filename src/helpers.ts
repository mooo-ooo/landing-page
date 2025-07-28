export const calculateSpread = (highPrice: number, lowPrice: number) => {
  const gap = Number(highPrice) - Number(lowPrice)
  const gapPercentage = (gap / highPrice) * 100
  return gapPercentage
}


export const percentageChange = (a: number, b: number) => (b / a) * 100 - 100

export function getPrecision (n: number) {
  let e = 1;
  let p = 0;
  while (Math.round(n * e) / e !== n) {
    e *= 10;
    p++;
  }
  return p;
}
export function strip(number: string) {
  return Number(parseFloat(number).toPrecision(12));
}

export const genExplorerTxUrl = (tx: string, chain: string) => {
  if (chain === 'BSC') {
    return `https://bscscan.com/tx/${tx}`
  }
  return tx
}

export const genExplorerAddUrl = (tx: string, chain: string) => {
  if (chain === 'BSC') {
    return `https://bscscan.com/address/${tx}`
  }
  return tx
}