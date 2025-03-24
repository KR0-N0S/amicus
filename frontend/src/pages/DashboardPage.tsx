import React from 'react';
import { Box, Typography } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1">
        Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Ta strona jest w trakcie implementacji.
      </Typography>
    </Box>
  );
};

export default DashboardPage;
