/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, Fragment, useEffect } from "react";
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
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import SaveIcon from "@mui/icons-material/Save";
import { useSelector, useDispatch } from "react-redux";
import { selectGroup, fetchGroup } from "../../redux/group/groupSlice";
import type { AppDispatch } from "../../redux/store";
import { useNormalizedPositions } from "../../hooks";
import { styled } from "@mui/system";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { red, green } from "../../constants/colors";
import api from "../../lib/axios";
import { transform, isEqual, has } from 'lodash'

// Styled component for TableCell
const TableCell = styled(TableCellMui)(() => ({
  padding: "12px 16px",
}));

function ExchangeLeverages() {
  const dispatch = useDispatch<AppDispatch>();
  const groupStore = useSelector(selectGroup);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const positions = useNormalizedPositions([]);
  const [token, setToken] = useState("");

  const [formData, setFormData] = useState({
    volumeThreshold: groupStore.volumeThreshold,
    ...groupStore.tokenLeverages,
  });

  // Use a separate state for the combined data to avoid re-calculating on every render
  const [existingSettings, setExistingSettings] = useState(formData);

  useEffect(() => {
    const initialData = {
      volumeThreshold: groupStore.volumeThreshold,
      ...groupStore.tokenLeverages,
    };
    setFormData(initialData);
    setExistingSettings(initialData);
  }, [groupStore.volumeThreshold, groupStore.tokenLeverages]);

  const handleUpdate = async () => {
    if (!existingSettings.volumeThreshold) {
      enqueueSnackbar("volumeThreshold is required", { variant: "error" });
      return;
    }
    if (token?.length !== 6) {
      enqueueSnackbar("Invalid 2FA token", { variant: "error" });
      return;
    }
    setIsLoading(true);
    const { volumeThreshold, ...tokenLeverages } = formData;
    const updates = getObjectDiff(groupStore.tokenLeverages as any, tokenLeverages);

    api
      .put(`/api/v1/groups/me`, {
        token,
        volumeThreshold,
        tokenLeverages: updates,
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
      .finally(async () => {
        await dispatch(fetchGroup());
        setFormData({
          volumeThreshold: groupStore.volumeThreshold,
          ...groupStore.tokenLeverages,
        });
        setIsLoading(false);
        setToken("");
      });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    let newFormData;

    if (name.includes(".")) {
      const [tokenKey, side] = name.split(".");
      const validValue =
        Number(value) > 90 ? 90 : Number(value) < 0 ? 0 : Number(value);

      newFormData = {
        ...formData,
        [tokenKey]: {
          ...(formData as any)[tokenKey],
          [side]: validValue,
        },
      };
    } else {
      newFormData = {
        ...formData,
        [name]: value,
      };
    }

    setFormData(newFormData);
    setExistingSettings(newFormData);
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
        px={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography>
          If the volume on two exchanges deviates by more than the
          "volumeThreshold," both positions will be force-closed.
        </Typography>
        <TextField
          size="small"
          sx={{ width: "200px" }}
          name="volumeThreshold"
          value={existingSettings.volumeThreshold || ""}
          onChange={handleChange}
          InputProps={{
            endAdornment: <InputAdornment position="end">USDT</InputAdornment>,
          }}
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
            <TableCell align="left" width="40%">
              <Typography color="textSecondary">Token</Typography>
            </TableCell>

            <TableCell align="left">
              <Box display="flex" gap={1} justifyContent="flex-start">
                <ArrowDownwardIcon sx={{ fill: red }} />
                <Typography color="textSecondary">Buy leverage</Typography>
              </Box>
            </TableCell>
            <TableCell align="right">
              <Box display="flex" gap={1} justifyContent="flex-end">
                <ArrowUpwardIcon sx={{ fill: green }} />
                <Typography color="textSecondary">Sell leverage</Typography>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.map(({ baseToken }) => {
            const { tokenLeverageWarning } = groupStore;
            const tokenKey = baseToken.toLowerCase();
            const buyValue =
              (existingSettings as any)?.[tokenKey]?.buy === undefined
                ? tokenLeverageWarning
                : (existingSettings as any)?.[tokenKey]?.buy;
            const sellValue =
              (existingSettings as any)?.[tokenKey]?.sell === undefined
                ? tokenLeverageWarning
                : (existingSettings as any)?.[tokenKey]?.sell;

            return (
              <Fragment key={baseToken}>
                <TableRow>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src={`https://assets.coincap.io/assets/icons/${tokenKey}@2x.png`}
                        alt={baseToken}
                        width={20}
                        height={20}
                      />
                      <Typography>{baseToken}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box
                      display="flex"
                      gap={1}
                      justifyContent="flex-start"
                      alignItems="center"
                    >
                      <RemoveIcon sx={{ opacity: 0.5 }} />
                      <TextField
                        sx={{ width: "200px" }}
                        type="number"
                        size="small"
                        name={`${tokenKey}.buy`}
                        value={buyValue}
                        onChange={handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      display="flex"
                      gap={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <AddIcon sx={{ opacity: 0.5 }} />
                      <TextField
                        sx={{ width: "200px" }}
                        type="number"
                        size="small"
                        name={`${tokenKey}.sell`}
                        value={sellValue}
                        onChange={handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      <Box
        px={2}
        mt={2}
        display="flex"
        width="100%"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <TextField
          sx={{ width: "300px" }}
          label="Enter 2FA Token"
          name="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          InputProps={{
            autoComplete: "off",
          }}
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

function getObjectDiff<T extends Record<string, any>>(
  oldObj: T,
  newObj: T
): Partial<T> {
  const diff: Partial<T> = {};

  // Find changes and additions in newObj compared to oldObj
  // If the value is different OR the key didn't exist in oldObj, it's a change/addition
  transform(newObj, (result, value, key) => {
    if (!isEqual(value, oldObj[key])) {
      (result as Record<string, any>)[key] = value;
    }
  }, diff);

  // Find removals (keys present in oldObj but not in newObj)
  // These keys are set to 'undefined' in the diff object to indicate removal
  transform(oldObj, (result, value, key) => {
    if (!has(newObj, key)) {
      (result as Record<string, any>)[key] = undefined; // Indicate removal
    }
  }, diff);

  return diff;
}