import { useState } from "react";

import {
  Box,
  Dialog,
  Button,
  DialogContent,
  DialogActions,
  DialogTitle,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import FormControl from "@mui/material/FormControl";
import LoadingButton from "@mui/lab/LoadingButton";
import { useSnackbar } from "notistack";
import type { SIDE } from "../../types";
import api from "../../lib/axios";

export interface ConfirmationDialogRawProps {
  id: string;
  side: SIDE;
  open: boolean;
  token: string;
  buyExchange: string;
  sellExchange: string;
  amount: number;
  onClose: (value?: string) => void;
}

function BalanceOrderConfirmationDialog(props: ConfirmationDialogRawProps) {
  const { amount, token, sellExchange, buyExchange, side } = props;
  const { onClose, open } = props;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState("increase");
  const [password, setPassword] = useState("");

  const handleCancel = () => {
    onClose();
  };

  const handleBalance = async () => {
    setLoading(true);
    const exchange = direction === "reduce" ? reduceExchange : increaseExchange;
    api
      .post("/api/v1/orders/imbalance", {
        exchange,
        quantity: amount,
        side,
        symbol: `${token}/USDT:USDT`,
        password,
      })
      .then(() =>
        enqueueSnackbar(
          `Placed market order: ${side} ${amount} ${token} [${exchange}]`,
          { variant: "success" }
        )
      )
      .catch((err) => {
        enqueueSnackbar(err.response?.data?.message || err.message, {
          variant: "error",
        });
        return {
          data: undefined,
        };
      })
      .finally(() => setLoading(false));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDirection((event.target as HTMLInputElement).value);
  };

  const increaseExchange = side === "sell" ? sellExchange : buyExchange;
  const reduceExchange = side !== "sell" ? sellExchange : buyExchange;

  return (
    <Dialog
      sx={{
        "& .MuiDialog-paper": { width: "650px" },
      }}
      keepMounted={false}
      maxWidth="xl"
      open={open}
    >
      <DialogTitle sx={{ fontSize: 16, background: "#1e2026" }}>
        <Typography fontWeight="bold">
        Balance positions [{amount} {token}]
        </Typography>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ padding: "16px 12px", background: "#1e2026" }}
      >
        <Box
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          flexDirection="column"
        >
          <FormControl>
            <RadioGroup
              value={direction}
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="sell"
              name="radio-buttons-group"
              onChange={handleChange}
            >
              {increaseExchange ? (
                <FormControlLabel
                  value="increase"
                  control={<Radio color="info" />}
                  label={`${side} ${increaseExchange} (Increase)`}
                />
              ) : null}
              {reduceExchange ? (
                <FormControlLabel
                  value="reduce"
                  control={<Radio color="info" />}
                  label={`${side} ${reduceExchange} (Reduce)`}
                />
              ) : null}
            </RadioGroup>
          </FormControl>
        </Box>
        <Box
          height="300px"
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <TextField
            onChange={(e) => setPassword(e.target.value)}
            id="standard-basic"
            label="password"
            variant="standard"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ width: "100%", background: "#1e2026" }}>
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          py={1}
        >
          <Button autoFocus onClick={handleCancel} color="error">
            Cancel
          </Button>
          <LoadingButton
            loading={loading}
            onClick={handleBalance}
            variant="contained"
          >
            Place Order
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default BalanceOrderConfirmationDialog;
