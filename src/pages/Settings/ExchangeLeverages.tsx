import { useState, Fragment } from "react";
import { AxiosError } from "axios";
import {
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell as TableCellMui,
  TableBody,
  Typography,
  InputAdornment,
  Alert,
  AlertTitle,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import SaveIcon from "@mui/icons-material/Save";
import numeral from "numeral";
import { useSelector, useDispatch } from "react-redux";
import type { IFuture } from "../../redux/balances/balancesSlice";
import { selectPositions } from "../../redux/positions/positionsSlice";
import { selectGroup, fetchGroup } from "../../redux/group/groupSlice";
import type { AppDispatch } from "../../redux/store";
import { styled } from "@mui/system";
import {
  selectBalances,
  selectBalancesError,
} from "../../redux/balances/balancesSlice";
import api from "../../lib/axios";

function ExchangeLeverages() {
  const dispatch = useDispatch<AppDispatch>();
  const groupStore = useSelector(selectGroup);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const error = useSelector(selectBalancesError);
  const balances = useSelector(selectBalances);
  const positions = useSelector(selectPositions);
  const [formData, setFormData] = useState<Record<string, string>>({
    hedgingAmount: groupStore.hedgingAmount,
    token: "",
    ...groupStore.exchangeLeverages,
  });

  const handleUpdate = async () => {
    setIsLoading(true);
    const { token, hedgingAmount, ...exchangeLeverages } = formData;
    api
      .put(`/api/v1/groups/me`, {
        token,
        hedgingAmount: Number(hedgingAmount),
        exchangeLeverages: convertStringValuesToNumbers(exchangeLeverages),
      })
      .then(() =>
        enqueueSnackbar(`Updated successfully`, { variant: "success" })
      )
      .catch((error) => {
        if (error instanceof AxiosError) {
          enqueueSnackbar(
            error.response?.data?.message || "Failed to save API keys",
            { variant: "error" }
          );
        } else {
          enqueueSnackbar("An unexpected error occurred", { variant: "error" });
        }
      })
      .finally(() => {
        dispatch(fetchGroup());
        setIsLoading(false);
        setFormData((prev) => ({
          ...prev,
          token: "",
        }));
      });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exchange leverages settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your positions are checked every 3 seconds. If a specific exchange's
          leverage exceeds the trigger level, the bot will find the exchange
          with the highest available funds and transfer USDT to the
          high-leverage exchange to hedge
        </Typography>
      </Box>
      <Box
        sx={{ mb: 1 }}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography>Enter your trigger transfered amount</Typography>
        <TextField
          sx={{ width: "300px" }}
          name="hedgingAmount"
          value={formData.hedgingAmount}
          onChange={handleChange}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">USDT</InputAdornment>
              ),
            },
          }}
          size="small"
        />
      </Box>

      <Table>
        <TableHead
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <TableRow sx={{ height: "48px" }}>
            <TableCell align="left">
              <Typography color="textSecondary">Exchange</Typography>
            </TableCell>

            <TableCell align="left">
              <Typography color="textSecondary">Current Leverage</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography color="textSecondary">Trigger leverage</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {error ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Alert severity="error">
                  <AlertTitle>Fetching balances error</AlertTitle>
                  {error}
                </Alert>
              </TableCell>
            </TableRow>
          ) : (
            Object.keys(balances).map((exchangeName) => {
              const vol = positions[
                exchangeName as unknown as keyof typeof balances
              ]?.reduce((tot, { markPrice, size }) => {
                return (tot = tot + markPrice * size);
              }, 0);
              const isShown =
                positions[exchangeName as unknown as keyof typeof balances]
                  ?.length > 0;

              const exchange: IFuture =
                balances[exchangeName as unknown as keyof typeof balances]
                  .future;

              if (!isShown) {
                return null;
              }
              return (
                <Fragment key={exchangeName}>
                  <TableRow key={exchangeName}>
                    <TableCell>
                      <Box display="flex" justifyItems="center" gap={2}>
                        <img
                          style={{
                            borderRadius: "50%",
                          }}
                          src={`/${exchangeName}.png`}
                          alt="USDT"
                          width={20}
                          height={20}
                        />
                        <Typography textTransform="capitalize">
                          {exchangeName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography>
                        x{numeral(vol / exchange.marginBalance).format("0.0")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        sx={{ width: "300px" }}
                        type="number"
                        name={exchangeName.toLowerCase()}
                        value={formData[exchangeName.toLowerCase()]}
                        onChange={handleChange}
                        InputProps={{
                          autoComplete: "off",
                        }}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
      <Box mt={2} display="flex" width="100%" justifyContent="space-between">
        <TextField
          sx={{ width: "300px" }}
          label="Enter 2FA Token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          InputProps={{
            autoComplete: "off",
          }}
          size="small"
        />
        <Box>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isLoading}
            onClick={handleUpdate}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default ExchangeLeverages;

const TableCell = styled(TableCellMui)(() => ({
  padding: "12px 16px",
}));

type StringKeyObject<T> = { [key: string]: T };

function convertStringValuesToNumbers(
  obj: StringKeyObject<string>
): StringKeyObject<number> {
  const result: StringKeyObject<number> = {};

  // Get all keys from the input object
  const keys = Object.keys(obj);

  // Iterate over each key
  for (const key of keys) {
    // Convert the string value to a number using parseFloat to handle decimals
    // If the conversion fails (e.g., the string is "hello"), it will return NaN
    result[key] = parseFloat(obj[key]);
  }

  return result;
}
