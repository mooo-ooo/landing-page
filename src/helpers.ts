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
  if (chain === 'BSC (BEP20)') {
    return `https://bscscan.com/tx/${tx}`
  }
  if (chain === 'TRX (TRC20)') {
    return `https://tronscan.org/#/transaction/${tx}`
  }
  if (chain === 'Avalanche C-Chain') {
    return `https://snowtrace.io/tx/${tx}`
  }
  return tx
}

export const genExplorerAddUrl = (tx: string, chain: string) => {
  if (chain === 'BSC (BEP20)') {
    return `https://bscscan.com/address/${tx}`
  }
  if (chain === 'TRX (TRC20)') {
    return `https://tronscan.org/#/address/${tx}`
  }
  if (chain === 'Avalanche C-Chain') {
    return `https://snowtrace.io/address/${tx}`
  }
  return tx
}

export interface IPurchase {
  quantity: number;
  price: number;
}

/**
 * Calculates the weighted average price of a series of purchases.
 * @param {Purchase[]} purchases An array of purchase objects, each containing a quantity and a price.
 * @returns {number | null} The weighted average price, or null if the total quantity is zero.
 */
export function calculateAveragePrice(purchases: IPurchase[]): number | null {
  // Use a try-catch block for robust error handling.
  try {
    let totalCost = 0;
    let totalQuantity = 0;

    // Use a for...of loop to iterate through the purchases array.
    for (const purchase of purchases) {
      // Ensure the inputs are valid numbers and non-negative.
      if (typeof purchase.quantity !== 'number' || typeof purchase.price !== 'number' || purchase.quantity < 0 || purchase.price < 0) {
        console.error("Invalid input: quantity and price must be non-negative numbers.");
        return null;
      }
      totalCost += purchase.quantity * purchase.price;
      totalQuantity += purchase.quantity;
    }

    // Check to prevent division by zero.
    if (totalQuantity === 0) {
      return null;
    }

    return totalCost / totalQuantity;
  } catch (error) {
    console.error("An error occurred during calculation:", error);
    return null;
  }
}

export interface ITransactionWithFundingRate {
  quantity: number;
  fundingRate: number;
}

/**
 * Calculates the weighted average funding rate for a series of transactions.
 * @param {Transaction[]} transactions An array of transaction objects.
 * @returns {number | null} The weighted average funding rate as a decimal, or null if there are no transactions.
 */
export function calculateWeightedAverageFundingRate(transactions: ITransactionWithFundingRate[]): number | null {
  // Use a try-catch block for robust error handling.
  try {
    let totalWeightedRate = 0;
    let totalQuantity = 0;

    // Iterate through each transaction to sum the weighted rates and total quantity.
    for (const transaction of transactions) {
      if (typeof transaction.quantity !== 'number' || typeof transaction.fundingRate !== 'number' || transaction.quantity < 0) {
        console.error("Invalid transaction data: quantity must be a non-negative number.");
        return null;
      }
      totalWeightedRate += transaction.quantity * transaction.fundingRate;
      totalQuantity += transaction.quantity;
    }

    // Prevent division by zero if total quantity is zero.
    if (totalQuantity === 0) {
      return null;
    }

    return totalWeightedRate / totalQuantity;
  } catch (error) {
    console.error("An error occurred during the calculation:", error);
    return null;
  }
}

export function calculateDaysBack(timestamp: number | string): number {
  // Ensure the timestamp is a number.
  const inputTimestampMs =
    typeof timestamp === "string" ? Number(timestamp) : timestamp;

  // Check for invalid input.
  if (isNaN(inputTimestampMs) || inputTimestampMs <= 0) {
    console.error("Invalid timestamp provided.");
    return 0;
  }

  const now = Date.now();
  const oneDayInMs = 1000 * 60 * 60 * 24;

  // Calculate the difference in milliseconds.
  const timeDifferenceMs = now - inputTimestampMs;

  // If the timestamp is in the future, return 0.
  if (timeDifferenceMs < 0) {
    return 0;
  }

  // Convert the difference to days and round down to the nearest whole number.
  const daysBack = Math.floor(timeDifferenceMs / oneDayInMs);

  return daysBack;
}