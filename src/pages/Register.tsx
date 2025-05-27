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
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Box, styled } from '@mui/system';

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

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: '0.5rem',
  color: '#848e9c',
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: 'transparent',
  },
}));

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await api.post('/api/v1/auth/register', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data) {
        // Registration successful, navigate to login
        navigate('/login');
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
          <Typography component="h1" variant="h5">
            Create Account
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
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <StyledTextField
              variant="standard"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <StyledTextField
              variant="standard"
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
            >
              Register
            </StyledButton>
            <LoginButton
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
            >
              Already have an account? Sign in
            </LoginButton>
          </StyledForm>
        </StyledPaper>
      </Box>
    </Container>
  );
}

export default Register; 