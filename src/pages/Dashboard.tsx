import type { FC } from 'react';
import { Container, Typography } from '@mui/material';

const Dashboard: FC = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
    </Container>
  );
};

export default Dashboard; 