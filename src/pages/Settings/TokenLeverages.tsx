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
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import SaveIcon from "@mui/icons-material/Save";
import { useSelector, useDispatch } from "react-redux";
import { selectGroup, fetchGroup } from "../../redux/group/groupSlice";
import type { AppDispatch } from "../../redux/store";
import { useNormalizedPositions } from "../../hooks";
import { styled } from "@mui/system";
import { merge, cloneDeep } from "lodash";
import api from "../../lib/axios";

function ExchangeLeverages() {
  const dispatch = useDispatch<AppDispatch>();
  const groupStore = useSelector(selectGroup);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const positions = useNormalizedPositions([]);
  const { tokenLeverageWarning } = groupStore;
  const [token, setToken] = useState("");
  const [formData, setFormData] = useState({
    // ...groupStore.tokenLeverages,
  });
  console.log({ formData }, groupStore.tokenLeverages);
  const existingSettings = merge(
    cloneDeep(groupStore.tokenLeverages),
    formData
  );
  const handleUpdate = async () => {
    setIsLoading(true);
    api
      .put(`/api/v1/groups/me`, {
        token,
        tokenLeverages: formData,
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
        setToken("");
      });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    const [token, side] = name.split(".");
    const validValue = Number(value) > 90 ? 90 : Number(value) < 0 ? 0 : value;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setFormData((prev) => ({
      ...prev,
      [token]: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ...prev[token],
        [side]: Number(validValue),
      },
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
              <Typography color="textSecondary">Buy leverage</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography color="textSecondary">Sell leverage</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.map(({ baseToken }) => {
            return (
              <Fragment key={baseToken}>
                <TableRow key={baseToken}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src={`https://assets.coincap.io/assets/icons/${baseToken.toLowerCase()}@2x.png`}
                        alt={baseToken}
                        width={20}
                        height={20}
                      />
                      <Typography>{baseToken}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      // variant="standard"
                      sx={{ width: "200px" }}
                      type="number"
                      size="small"
                      defaultValue={tokenLeverageWarning}
                      name={`${baseToken.toLowerCase()}.buy`}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      value={existingSettings[baseToken.toLowerCase()]?.buy}
                      onChange={handleChange}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      // variant="standard"
                      sx={{ width: "200px" }}
                      type="number"
                      size="small"
                      defaultValue={tokenLeverageWarning}
                      name={`${baseToken.toLowerCase()}.sell`}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      value={existingSettings[baseToken.toLowerCase()]?.sell}
                      onChange={handleChange}
                      slotProps={{
                        htmlInput: { max: 90 },
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">%</InputAdornment>
                          ),
                        },
                      }}
                    />
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

const TableCell = styled(TableCellMui)(() => ({
  padding: "12px 16px",
}));
