import type { FC } from "react";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { Box, Typography, TextField, Grid } from "@mui/material";
import numeral from "numeral";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import ExchangeMargin from "../components/ExchangeMargin";

const exchanges = ["coinex", "huobi", "okx", "bybit", "gate", "bitget"];

const Dashboard: FC = () => {
  const balances = useSelector((state: RootState) => state.balances);
  // const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [ggToken, setToken] = useState("");
  const [fromEx, setFromExchange] = useState("");
  const [toEx, setToExchange] = useState("");
  const [withdrawMap] = useState<Record<string, string>>({});
  // const [isTransferPending, setisTransferPending] = useState<boolean>(false);

  const handleChangeFrom = (event: SelectChangeEvent) => {
    setFromExchange(event.target.value);
  };
  const handleChangeTo = (event: SelectChangeEvent) => {
    setToExchange(event.target.value);
  };

  const chainSelected = useMemo(() => {
    if (!fromEx || !toEx || !withdrawMap) {
      return null;
    }
    return withdrawMap[`${fromEx}-${toEx}`];
  }, [fromEx, toEx, withdrawMap]);

  // const validEx =
  //   exchanges.includes(fromEx) && exchanges.includes(toEx) && fromEx !== toEx;

  const selectedFromEx = fromEx
    ? balances[fromEx as unknown as keyof typeof balances]
    : null;
  const selectedToEx = toEx
    ? balances[toEx as unknown as keyof typeof balances]
    : null;

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Grid container spacing={4}>
        <Grid size={5}>
          <ExchangeMargin />
        </Grid>
        <Grid size={7}>
          <Box sx={{ border: '1px solid rgba(81, 81, 81, 1)'}} padding={2}>
            <FormControl fullWidth sx={{ mb: 4 }}>
              {selectedFromEx ? (
                <Typography fontSize={14} variant="caption">
                  Availale balance:&nbsp;
                  {numeral(
                    (
                      selectedFromEx as unknown as {
                        future: { marginAvailable: number };
                        trading: { marginAvailable: number };
                      }
                    )?.future?.marginAvailable ||
                      (
                        selectedFromEx as unknown as {
                          future: { marginAvailable: number };
                          trading: { marginAvailable: number };
                        }
                      )?.trading?.marginAvailable
                  ).format("0,0.0")}{" "}
                  USDT
                </Typography>
              ) : (
                <Typography fontSize={14} variant="caption">
                  From exchange
                </Typography>
              )}
              <Select value={fromEx} onChange={handleChangeFrom} displayEmpty>
                {exchanges.map((ex) => (
                  <MenuItem disabled={ex === toEx} key={ex} value={ex}>
                    {ex}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 4 }}>
              {selectedToEx ? (
                <Typography fontSize={14} variant="caption">
                  Availale balance: &nbsp;
                  {numeral(
                    (
                      selectedToEx as unknown as {
                        future: { marginAvailable: number };
                        trading: { marginAvailable: number };
                      }
                    )?.future?.marginAvailable ||
                      (
                        selectedToEx as unknown as {
                          future: { marginAvailable: number };
                          trading: { marginAvailable: number };
                        }
                      )?.trading?.marginAvailable
                  ).format("0,0.0")}{" "}
                  USDT
                </Typography>
              ) : (
                <Typography fontSize={14} variant="caption">
                  To exchange
                </Typography>
              )}
              <Select value={toEx} onChange={handleChangeTo} displayEmpty>
                {exchanges.map((ex) => (
                  <MenuItem disabled={ex === fromEx} key={ex} value={ex}>
                    {ex}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {chainSelected ? (
              <Typography sx={{ mb: 4 }} fontSize={14} variant="caption">
                Chain: {chainSelected}
              </Typography>
            ) : null}
            <FormControl fullWidth sx={{ mb: 4 }}>
              <TextField
                fullWidth
                id="filled-number"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  const val = Number(event.target.value);
                  setAmount(val);
                }}
                label={`Amount`}
                type="number"
                value={amount || ""}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: "5",
                  min: String(30),
                }}
                variant="standard"
              />
            </FormControl>
            <FormControl fullWidth sx={{ mb: 4 }}>
              <TextField
                fullWidth
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setToken(event.target.value);
                }}
                label={`Fund password`}
                type="string"
                value={ggToken}
                InputLabelProps={{
                  shrink: true,
                }}
                variant="standard"
              />
            </FormControl>
            {/* {isTransferPending ? (
          <Button
            onClick={handleResolveTransferPending}
            disabled={!isTransferPending}
            variant="contained"
            endIcon={<SwapVertIcon />}
          >
            {isTransferPending ? "Resolve" : "All gud"}
          </Button>
        ) : null} */}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
