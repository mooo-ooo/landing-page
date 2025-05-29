import type { FC } from 'react';
import { Container, Typography, Box } from '@mui/material';
import TokenFundingPanel from '../components/TokenFundingPanel';

const Home: FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Funding Rate Differences
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Monitor funding rate differences across exchanges to identify arbitrage opportunities.
        </Typography>
      </Box>
      <TokenFundingPanel />
    </Container>
  );
};

export default Home;