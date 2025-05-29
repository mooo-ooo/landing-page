import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { TableRow, TableCell, Typography, Box } from '@mui/material';
import numeral from 'numeral';
import { getExchangeFundingRate } from '../services/funding';
import type { ExchangeName } from '../types/exchange';

interface TokenFundingDiffProps {
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
  baseToken: string;
  weeklyAccumulatedDiff: number;
}

const TokenFundingDiff: FC<TokenFundingDiffProps> = ({
  buyExchange,
  sellExchange,
  baseToken,
  weeklyAccumulatedDiff,
}) => {
  const [currentDiff, setCurrentDiff] = useState<number>(0);
  const [buyRate, setBuyRate] = useState<number>(0);
  const [sellRate, setSellRate] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundingRates = async () => {
      try {
        const [buyRateResponse, sellRateResponse] = await Promise.all([
          getExchangeFundingRate(buyExchange, baseToken),
          getExchangeFundingRate(sellExchange, baseToken),
        ]);

        const buyRateValue = buyRateResponse.rate * 100; // Convert to percentage
        const sellRateValue = sellRateResponse.rate * 100; // Convert to percentage
        setBuyRate(buyRateValue);
        setSellRate(sellRateValue);
        setCurrentDiff(sellRateValue - buyRateValue);
        setError(null);
      } catch (err) {
        setError('Failed to fetch funding rates');
        console.error('Error fetching funding rates:', err);
      }
    };

    fetchFundingRates();
    const interval = setInterval(fetchFundingRates, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [buyExchange, sellExchange, baseToken]);

  const getDiffColor = (diff: number) => {
    if (diff > 0) return 'success.main';
    if (diff < 0) return 'error.main';
    return 'text.secondary';
  };

  // Calculate APR: funding difference * 3 times per day * 365 days
  const calculateAPR = (diff: number) => {
    return diff * 3 * 365;
  };

  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={4}>
          <Typography color="error">{error}</Typography>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body1" fontWeight="medium">
          {baseToken}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography color={getDiffColor(currentDiff)}>
          {numeral(calculateAPR(currentDiff)).format('0.00')}%
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography color={getDiffColor(weeklyAccumulatedDiff)}>
          {numeral(weeklyAccumulatedDiff).format('0.00')}%
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography component="span" sx={{ color: 'error.main' }}>
              {sellExchange}
            </Typography>
            <Typography component="span" color="text.secondary" variant="caption">
              ({numeral(sellRate).format('0.00')}%)
            </Typography>
          </Box>
          <Typography component="span" color="text.secondary">
            /
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography component="span" sx={{ color: 'success.main' }}>
              {buyExchange}
            </Typography>
            <Typography component="span" color="text.secondary" variant="caption">
              ({numeral(buyRate).format('0.00')}%)
            </Typography>
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default TokenFundingDiff;

