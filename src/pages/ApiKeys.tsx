import { useState, useEffect } from 'react';
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
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff, Edit as EditIcon } from '@mui/icons-material';

interface ExchangeKey {
  id: number;
  exchange: string;
  api_key: string;
  secret_key: string;
  passphrase?: string;
}

const ALL_EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'okx', label: 'OKX' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'coinex', label: 'Coinex' },
  { value: 'huobi', label: 'Huobi' },
  { value: 'gate', label: 'Gate.io' },
  { value: 'bitget', label: 'Bitget' },
];

function ApiKeys() {
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [exchangeKeys, setExchangeKeys] = useState<ExchangeKey[]>([]);
  const [editingKey, setEditingKey] = useState<ExchangeKey | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    exchange: '',
    key: '',
    secret: '',
    passphrase: '',
    token: '',
  });

  const getExchangeKey = (exchange: string) => {
    return exchangeKeys.find(key => key.exchange === exchange);
  };

  const fetchExchangeKeys = async () => {
    try {
      const response = await api.get('/api/v1/exchange/keys', {
        headers: {
          'x-group-id': '1'
        }
      });
      if (response.data) {
        setExchangeKeys(response.data);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Failed to fetch API keys');
      } else {
        setError('An unexpected error occurred while fetching API keys');
      }
    }
  };

  useEffect(() => {
    fetchExchangeKeys();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const payload = {
        exchange: formData.exchange,
        key: formData.key,
        secret: formData.secret,
        passphrase: formData.passphrase || undefined,
        token: formData.token,
      };

      await api.post('/api/v1/exchange/keys', payload);
      setSuccess('API keys saved successfully');

      setFormData({
        exchange: '',
        key: '',
        secret: '',
        passphrase: '',
        token: '',
      });
      setEditingKey(null);
      setIsDialogOpen(false);
      fetchExchangeKeys();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Failed to save API keys');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (key: ExchangeKey) => {
    setEditingKey(key);
    setFormData({
      exchange: key.exchange,
      key: key.api_key,
      secret: key.secret_key,
      passphrase: key.passphrase || '',
      token: '',
    });
    setIsDialogOpen(true);
  };

  const handleAdd = (exchange: string) => {
    setEditingKey(null);
    setFormData({
      exchange,
      key: '',
      secret: '',
      passphrase: '',
      token: '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKey(null);
    setFormData({
      exchange: '',
      key: '',
      secret: '',
      passphrase: '',
      token: '',
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exchange API Keys
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your exchange API keys for automated trading
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Exchange</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ALL_EXCHANGES.map((exchange) => {
              const existingKey = getExchangeKey(exchange.value);
              return (
                <TableRow key={exchange.value}>
                  <TableCell>{exchange.label}</TableCell>
                  <TableCell>
                    {existingKey ? (
                      <Typography color="success.main">Configured</Typography>
                    ) : (
                      <Typography color="text.secondary">Not configured</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {existingKey ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(existingKey)}
                      >
                        Update
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAdd(exchange.value)}
                      >
                        Add
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={isDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingKey ? 'Update API Keys' : 'Add New API Keys'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="exchange-label">Exchange</InputLabel>
              <Select
                labelId="exchange-label"
                name="exchange"
                value={formData.exchange}
                label="Exchange"
                onChange={handleChange}
                required
              >
                {ALL_EXCHANGES.map((exchange) => (
                  <MenuItem key={exchange.value} value={exchange.value}>
                    {exchange.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="API Key"
              name="key"
              value={formData.key}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Secret Key"
              name="secret"
              type={showSecretKey ? 'text' : 'password'}
              value={formData.secret}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      edge="end"
                    >
                      {showSecretKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Passphrase (Optional)"
              name="passphrase"
              type={showPassphrase ? 'text' : 'password'}
              value={formData.passphrase}
              onChange={handleChange}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      edge="end"
                    >
                      {showPassphrase ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="2FA Code"
              name="token"
              value={formData.token}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              placeholder="Enter code from your authenticator app"
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : editingKey ? 'Update Keys' : 'Save Keys'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default ApiKeys; 