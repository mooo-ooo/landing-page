import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import api from '../lib/axios';
import { fetchUserData } from '../redux/slices/userSlice';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/system';

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(8),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '400px',
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

function TwoFactorAuth() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.data);
  const [error, setError] = useState<string>();
  const [qrCode, setQrCode] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await dispatch(fetchUserData());
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };

    fetchUser();
  }, [dispatch]);

  useEffect(() => {
    const setup2FA = async () => {
      if (user && !user.twoFactorEnabled) {
        try {
          const response = await api.post('/api/v1/auth/2fa/setup');
          setQrCode(response.data.qrCode);
          setOpenDialog(true);
        } catch (err) {
          if (err instanceof AxiosError) {
            setError(err.response?.data?.message || 'Failed to fetch QR code');
          } else {
            setError('An unexpected error occurred');
          }
        }
      }
    };

    setup2FA();
  }, [user]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/auth/2fa/enable', {
        token: verificationCode,
      });

      if (response?.data?.success) {
        setOpenSuccessDialog(true);
        if (response?.data?.accessToken) {
          localStorage.setItem('token', response.data.accessToken);
        }
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Verification failed. Please try again.');
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
          <Typography component="h1" variant="h5" gutterBottom>
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter the verification code from your authenticator app
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
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
              }}
            />
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </StyledButton>
          </StyledForm>
        </StyledPaper>
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Scan QR Code</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            p: 3, 
            bgcolor: '#fff', 
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            mx: 'auto',
            my: 2,
            maxWidth: 240
          }}>
            <img
              src={qrCode}
              alt="QR Code"
              loading="lazy"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: 1
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Scan this QR code with Google Authenticator app
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openSuccessDialog}
        onClose={handleCloseSuccessDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Success!</DialogTitle>
        <DialogContent>
          <Typography variant="body1" align="center" sx={{ mt: 2 }}>
            Two-factor authentication has been successfully enabled for your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary">
            Continue to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TwoFactorAuth; 