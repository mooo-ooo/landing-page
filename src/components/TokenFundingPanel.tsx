import type { FC } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
} from '@mui/material';
import TokenFundingDiff from './TokenFundingDiff';
import type { ExchangeName } from '../types/exchange';

// Mock data for demonstration
const mockData = [
  {
    baseToken: 'BTC',
    buyExchange: 'okx' as ExchangeName,
    sellExchange: 'huobi' as ExchangeName,
    weeklyAccumulatedDiff: 0.0123,
  },
  {
    baseToken: 'ETH',
    buyExchange: 'huobi' as ExchangeName,
    sellExchange: 'okx' as ExchangeName,
    weeklyAccumulatedDiff: -0.0087,
  },
  {
    baseToken: 'BNB',
    buyExchange: 'okx' as ExchangeName,
    sellExchange: 'huobi' as ExchangeName,
    weeklyAccumulatedDiff: 0.0234,
  },
  {
    baseToken: 'SOL',
    buyExchange: 'okx' as ExchangeName,
    sellExchange: 'huobi' as ExchangeName,
    weeklyAccumulatedDiff: 0.0234,
  },
  {
    baseToken: 'DOGE',
    buyExchange: 'okx' as ExchangeName,
    sellExchange: 'huobi' as ExchangeName,
    weeklyAccumulatedDiff: 0.0234,
  },
  {
    baseToken: 'SHIB',
    buyExchange: 'okx' as ExchangeName,
    sellExchange: 'huobi' as ExchangeName,
    weeklyAccumulatedDiff: 0.0234,
  },
];

const TokenFundingPanel: FC = () => {
  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Token</TableCell>
            <TableCell align="right">Current APR</TableCell>
            <TableCell align="right">Weekly Accumulated</TableCell>
            <TableCell align="right">Exchanges</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockData.map((token) => (
            <TokenFundingDiff
              key={token.baseToken}
              baseToken={token.baseToken}
              buyExchange={token.buyExchange}
              sellExchange={token.sellExchange}
              weeklyAccumulatedDiff={token.weeklyAccumulatedDiff}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TokenFundingPanel;
