import type { FC } from 'react';
import { Container } from '@mui/material';
import PositionsTable from '../components/PositionsTable';

const Dashboard: FC = () => {
  return (
    <Container>
      <PositionsTable />
    </Container>
  );
};

export default Dashboard; 