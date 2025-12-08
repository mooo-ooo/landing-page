import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../lib/axios';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Box,
} from '@mui/material';
import { styled } from '@mui/system';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '500px',
  margin: '0 auto',
  background: '#1e2026',
  color: '#fff',
}));

const StyledForm = styled('form')({
  width: '100%',
  marginTop: '1rem',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#2b2f36',
    },
    '&:hover fieldset': {
      borderColor: '#2b2f36',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: '#848e9c',
  },
  '& .MuiInputBase-input': {
    color: '#fff',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: '1rem',
  backgroundColor: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    opacity: 0.8,
  },
}));

function TwoFactorVerify() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    const verificationId = localStorage.getItem('verification_id');
    if (!verificationId) {
      setError('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    try {
      const response = await api.post('/api/v1/auth/verify-2fa', {
        token: verificationCode,
        verification_id: verificationId,
      }, {
        headers: {
          Authorization: `Bearer ${verificationId}`
        }
      });

      if (response?.data?.accessToken) {
        // Clear the verification ID
        localStorage.removeItem('verification_id');
        // Store the new access token
        localStorage.setItem('token', response.data.accessToken);
        navigate('/');
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.message || 'Verification request expired';
        setError(errorMessage);
        
        localStorage.removeItem('verification_id');
        navigate('/login');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'primary.main'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h6" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Please enter the 6-digit code from your authenticator app
          </Typography>

          <StyledForm onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <StyledTextField
              variant="standard"
              margin="normal"
              required
              fullWidth
              label="6-Digit Code"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numeric input
                if (/^\d*$/.test(value)) {
                  setVerificationCode(value);
                }
              }}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
            />
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </StyledButton>
          </StyledForm>
        </StyledPaper>
      </Box>
    </Container>
  );
}

export default TwoFactorVerify; 