import { useState, useEffect } from "react";
import { AxiosError } from "axios";
import api from "../../lib/axios";
import {
  TextField,
  Button,
  Typography,
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
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { green, red } from "../../constants/colors";
import {
  selectPositions,
  type PostitionsState,
} from "../../redux/positions/positionsSlice";

const ALL_EXCHANGES = [
  { value: "binance", label: "Binance" },
  { value: "okx", label: "OKX" },
  { value: "bybit", label: "Bybit" },
  { value: "coinex", label: "Coinex" },
  { value: "huobi", label: "Huobi" },
  { value: "gate", label: "Gate" },
  { value: "bitget", label: "Bitget" },
];

const exchangesWithPassphrase: string[] = ["bitget", "okx"];

function ApiKeys() {
  const positions = useSelector(selectPositions);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [exchangeKeys, setExchangeKeys] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [deletingOtp, setDeletingOtp] = useState("");
  const [deletingEx, setDeletingEx] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    exchange: "",
    key: "",
    secret: "",
    passphrase: "",
    token: "",
  });

  const getExchangeKey = (exchange: string) => {
    return exchangeKeys?.find((exchangeKey) => exchangeKey === exchange);
  };

  const fetchExchangeKeys = async () => {
    try {
      const response = await api.get("/api/v1/exchange/configured", {
        headers: {
          "x-group-id": "1",
        },
      });
      if (response.data) {
        setExchangeKeys(response.data);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch API keys");
      } else {
        setError("An unexpected error occurred while fetching API keys");
      }
    }
  };

  useEffect(() => {
    fetchExchangeKeys();
  }, []);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
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

      await api.post("/api/v1/exchange/keys", payload);
      setSuccess("API keys saved successfully");

      setFormData({
        exchange: "",
        key: "",
        secret: "",
        passphrase: "",
        token: "",
      });
      setEditingKey(null);
      setIsDialogOpen(false);
      fetchExchangeKeys();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to save API keys");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (exchange: string) => {
    setEditingKey(exchange);
    setFormData({
      exchange: exchange,
      key: "",
      secret: "",
      passphrase: "",
      token: "",
    });
    setIsDialogOpen(true);
  };

  const handleRemove = async (exchange: string) => {
    setError(undefined)
    setIsLoading(true);
    try {
      await api.delete(
        `/api/v1/exchange/keys?exchange=${exchange}&token=${deletingOtp}`
      );
      fetchExchangeKeys();
      setDeletingEx(null);
      setSuccess("API keys removed successfully");
    } catch (error) {
      setDeletingEx(null);
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Failed to save API keys");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (exchange: string) => {
    setEditingKey(null);
    setFormData({
      exchange,
      key: "",
      secret: "",
      passphrase: "",
      token: "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingKey(null);
    setFormData({
      exchange: "",
      key: "",
      secret: "",
      passphrase: "",
      token: "",
    });
  };

  const invalidToRemove =
    positions[deletingEx?.toLowerCase() as unknown as keyof PostitionsState]
      ?.length > 0;

  return (
    <Box
      maxWidth="lg"
      display="flex"
      flexDirection="column"
      gap="12px"
      py="16px"
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exchange API Keys
        </Typography>
        <Typography variant="body1" color="textSecondary">
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

      <Box sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography color="textSecondary">Exchange</Typography>
              </TableCell>
              <TableCell>
                <Typography color="textSecondary">Status</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography color="textSecondary">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ALL_EXCHANGES.map((exchange) => {
              const existingKey = getExchangeKey(exchange.value);
              return (
                <TableRow key={exchange.value}>
                  <TableCell>
                    <Box display="flex" gap={2}>
                      <img
                        width={20}
                        height={20}
                        style={{
                          borderRadius: "50%",
                        }}
                        src={`/${exchange.label.toLowerCase()}.png`}
                      />
                      <Typography>{exchange.label}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {existingKey ? (
                      <Typography sx={{ color: green }}>Configured</Typography>
                    ) : (
                      <Typography color="textSecondary">
                        Not configured
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {existingKey ? (
                      <Box display="flex" gap={2} justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(existingKey)}
                        >
                          Update
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => setDeletingEx(exchange.label)}
                        >
                          Remove
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        sx={{ width: 84 }}
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
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
      </Box>

      <Dialog
        open={Boolean(deletingEx)}
        onClose={() => setDeletingEx(null)}
        sx={{ "& .MuiDialog-paper": { width: "650px" } }}
        maxWidth="xl"
      >
        <DialogTitle sx={{ fontSize: 16, background: "#1e2026", color: red }}>
          Delete {deletingEx}'s api key
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent
            sx={{
              background: "#1e2026",
              paddingBottom: "32px",
            }}
          >
            <Typography>
              {invalidToRemove
                ? "You cannot delete this api key because you still have open positions."
                : "Please double-check and make sure this exchange has closed all positions."}
            </Typography>
            {invalidToRemove ? null : (
              <TextField
                fullWidth
                label="2FA Code"
                name="token"
                value={deletingOtp}
                onChange={(e) => setDeletingOtp(e.target.value as string)}
                required
                sx={{ my: 2 }}
                placeholder="Enter code from your authenticator app"
                inputProps={{
                  maxLength: 6,
                  pattern: "[0-9]*",
                  inputMode: "numeric",
                }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ width: "100%", background: "#1e2026" }}>
            <Button color="inherit" onClick={() => setDeletingEx(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                deletingEx && handleRemove(deletingEx?.toLowerCase())
              }
              color="error"
              type="submit"
              variant="contained"
              disabled={isLoading || invalidToRemove}
            >
              {isLoading ? "Removing..." : "Remove api key"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        sx={{ "& .MuiDialog-paper": { width: "650px" } }}
        maxWidth="xl"
      >
        <DialogTitle sx={{ fontSize: 16, background: "#1e2026" }}>
          {editingKey ? "Update API Keys" : "Add New API Keys"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent
            sx={{
              background: "#1e2026",
              paddingBottom: "32px",
            }}
          >
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="exchange-label">Exchange</InputLabel>
              <Select
                labelId="exchange-label"
                name="exchange"
                value={formData.exchange}
                label="Exchange"
                onChange={handleChange}
                required
                disabled={Boolean(editingKey)}
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
              InputProps={{
                autoComplete: "off",
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Secret Key"
              name="secret"
              type="password"
              value={formData.secret}
              onChange={handleChange}
              sx={{ mb: 2 }}
              InputProps={{
                autoComplete: "off",
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

            {exchangesWithPassphrase.includes(formData.exchange) ? (
              <TextField
                fullWidth
                label="Passphrase (Optional)"
                name="passphrase"
                type={showPassphrase ? "text" : "password"}
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
            ) : null}

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
                pattern: "[0-9]*",
                inputMode: "numeric",
              }}
            />
          </DialogContent>
          <DialogActions sx={{ width: "100%", background: "#1e2026" }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : editingKey
                ? "Update Keys"
                : "Save Keys"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

export default ApiKeys;
