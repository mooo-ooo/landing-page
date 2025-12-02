import { useState, useMemo, useEffect, Fragment } from "react";

import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
  InputAdornment,
  FormControlLabel,
  RadioGroup,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
} from "@mui/material";
import type { IStrategy } from "../../redux/strategy/strategySlice";
import {
  fetchStrategies,
  selectStrategies,
} from "../../redux/strategy/strategySlice";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import LoadingButton from "@mui/lab/LoadingButton";
import { selectBalances } from "../../redux/balances/balancesSlice";
import type { AppDispatch } from "../../redux/store";
import { useSelector, useDispatch } from "react-redux";
import api from "../../lib/axios";

export interface UpdateStrategyProps {
  baseToken?: string;
  id?: string;
  open: boolean;
  onClose: () => void;
}

function UpdateStrategyDialog(props: UpdateStrategyProps) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const [strategy, setStrategy] = useState<Partial<IStrategy>>({});
  const balances = useSelector(selectBalances);
  const strategies = useSelector(selectStrategies);
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { onClose, open, baseToken } = props;
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({
    severity: "",
    message: "",
  });

  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  const handleOnChangeStrategy = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategy((prev) => {
      return {
        ...prev,
        [e.target.name]: e.target.value,
      };
    });
  };

  useEffect(() => {
    dispatch(fetchStrategies())
  }, [])

  useEffect(() => {
    if (baseToken && strategies.length) {
      const found = strategies.find(({ sellSymbol, buySymbol }: IStrategy) => {
        return (
          buySymbol === sellSymbol && buySymbol === `${baseToken}/USDT:USDT`
        );
      });
      if (found) {
        setStrategy(found);
      }
    }
  }, [strategies, baseToken]);

  const handleSubmit = async () => {
    setLoading(true);
    api
      .put("/api/v1/strategies", strategy)
      .then(() => {
        setAlertMsg({
          severity: "success",
          message: "Strategy updated successfully",
        });
        setTimeout(() => {
          onClose()
        }, 3000);
        dispatch(fetchStrategies());
      })
      .catch((err) => {
        setAlertMsg({
          severity: "error",
          message: err.response.data.message,
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      sx={{ "& .MuiDialog-paper": { width: "650px" } }}
      maxWidth="xl"
      open={open}
    >
      <DialogTitle sx={{ fontSize: 16, background: "#1e2026" }}>
        Update Strategy: {baseToken}
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        dividers
        sx={{
          background: "#1e2026",
          paddingBottom: "32px",
        }}
      >
        {strategy.strategyName ? (
          <Fragment>
            <Box display="flex" width="100%" flexDirection="column">
              <Typography>Strategy name (unique):</Typography>
              <TextField
                fullWidth
                size="small"
                onChange={handleOnChangeStrategy}
                type="string"
                name="strategyName"
                value={strategy.strategyName}
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
              />
            </Box>
            <Box height={16} />
            <Box
              display="flex"
              alignItems="flex-start"
              justifyContent="space-between"
              flexDirection="column"
            >
              <Box
                display="flex"
                width="100%"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography color="rgb(246, 70, 93)">Sell exchange:</Typography>
                <FormControl sx={{ width: "150px" }}>
                  <Select
                    size="small"
                    displayEmpty
                    name="sellExchange"
                    inputProps={{ "aria-label": "Without label" }}
                    value={strategy.sellExchange}
                    onChange={(e) => {
                      setStrategy({
                        ...strategy,
                        [e.target.name]: e.target.value,
                      });
                    }}
                  >
                    {exchanges.map((exchange) => (
                      <MenuItem value={exchange}>{exchange}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box height={4} />
              <Box
                display="flex"
                width="100%"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography color="rgb(14, 203, 129)">Buy exchange:</Typography>
                <FormControl sx={{ width: "150px" }}>
                  <Select
                    size="small"
                    displayEmpty
                    inputProps={{ "aria-label": "Without label" }}
                    value={strategy.buyExchange}
                    name="buyExchange"
                    onChange={(e) => {
                      setStrategy({
                        ...strategy,
                        [e.target.name]: e.target.value,
                      });
                    }}
                  >
                    {exchanges.map((exchange) => (
                      <MenuItem value={exchange}>{exchange}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box height={16} />
            <Box
              display="flex"
              flexDirection="row"
              sx={{
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Typography>Direction</Typography>
              <RadioGroup
                value={strategy.isReduce ? "close" : "open"}
                row
                onChange={(e) => {
                  if (e.target.value === "open") {
                    setStrategy((prev) => {
                      return {
                        ...prev,
                        isReduce: false,
                        isIncrease: true,
                      };
                    });
                  } else {
                    setStrategy((prev) => {
                      return {
                        ...prev,
                        isReduce: true,
                        isIncrease: false,
                      };
                    });
                  }
                }}
              >
                <FormControlLabel
                  value="open"
                  control={<Radio />}
                  label="Open"
                />
                <FormControlLabel
                  value="close"
                  control={<Radio />}
                  label="Close"
                />
              </RadioGroup>
            </Box>
            <Box height={16} />
            <Box>
              {strategy.isIncrease ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  padding={2}
                  sx={{ background: "rgb(14 203 129 / 10%)" }}
                >
                  <Typography>Spread rate</Typography>
                  <Box display="flex" gap={1}>
                    <Box display="flex" width="100%" flexDirection="column">
                      <Typography fontSize={12} color="textSecondary">
                        First:
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        onChange={handleOnChangeStrategy}
                        type="string"
                        name="bestInSpread"
                        value={strategy.bestInSpread}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          },
                        }}
                        variant="outlined"
                      />
                      <Typography color="textSecondary" fontSize={12}>
                        Current spread rate 0.1%
                      </Typography>
                    </Box>
                    <Box height={16} />
                    <Box display="flex" width="100%" flexDirection="column">
                      <Typography fontSize={12} color="textSecondary">
                        Second:
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        onChange={handleOnChangeStrategy}
                        type="string"
                        name="secondInSpread"
                        value={strategy.secondInSpread}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          },
                        }}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  padding={2}
                  sx={{ background: "rgb(246 70 93 / 10%)" }}
                >
                  <Typography>Spread rate</Typography>
                  <Box display="flex" gap={1}>
                    <Box display="flex" width="100%" flexDirection="column">
                      <Typography fontSize={12} color="textSecondary">
                        First
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        onChange={handleOnChangeStrategy}
                        type="string"
                        name="bestOutSpread"
                        value={strategy.bestOutSpread}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          },
                        }}
                        variant="outlined"
                      />
                      <Typography fontSize={12} color="textSecondary">
                        Current spread rate 0.1%
                      </Typography>
                    </Box>
                    <Box height={16} />
                    <Box display="flex" width="100%" flexDirection="column">
                      <Typography fontSize={12} color="textSecondary">
                        Second
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        onChange={handleOnChangeStrategy}
                        type="string"
                        name="secondOutSpread"
                        value={strategy.secondOutSpread}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          },
                        }}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Box height={16} />
            <Box display="flex" width="100%" flexDirection="column">
              <Typography>Max amount per order:</Typography>
              <TextField
                name="maxOrderVol"
                fullWidth
                size="small"
                onChange={handleOnChangeStrategy}
                type="string"
                value={strategy.maxOrderVol}
                InputLabelProps={{
                  shrink: true,
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">USDT</InputAdornment>
                    ),
                  },
                }}
                variant="outlined"
              />
              <Typography color="textSecondary" fontSize={12}>
                Suggested max amount pre order 1000 USDT
              </Typography>
            </Box>
            <Box height={16} />
            <Box display="flex" width="100%" flexDirection="column">
              <Typography>Required vol per order:</Typography>
              <TextField
                name="requiredOrderVol"
                fullWidth
                size="small"
                onChange={handleOnChangeStrategy}
                type="string"
                value={strategy.requiredOrderVol}
                InputLabelProps={{
                  shrink: true,
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">USDT</InputAdornment>
                    ),
                  },
                }}
                variant="outlined"
              />
            </Box>
            <Box height={16} />
            {strategy.isIncrease ? (
              <Box display="flex" width="100%" flexDirection="column">
                <Typography>Max volume:</Typography>
                <TextField
                  name="maxVolOfPosition"
                  fullWidth
                  size="small"
                  onChange={handleOnChangeStrategy}
                  type="string"
                  value={strategy.maxVolOfPosition}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">USDT</InputAdornment>
                      ),
                    },
                  }}
                  variant="outlined"
                />
                <Typography color="textSecondary" fontSize={12}>
                  Volumn per side
                </Typography>
              </Box>
            ) : (
              <Box display="flex" width="100%" flexDirection="column">
                <Typography>Min volume:</Typography>
                <TextField
                  name="minVolOfPosition"
                  fullWidth
                  size="small"
                  onChange={handleOnChangeStrategy}
                  type="string"
                  value={strategy.minVolOfPosition}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">USDT</InputAdornment>
                      ),
                    },
                  }}
                  variant="outlined"
                />
                <Typography color="textSecondary" fontSize={12}>
                  Volumn per side
                </Typography>
              </Box>
            )}
            <Box height={16} />
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <SettingsIcon />
                <Typography component="span">Advanced settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  display="flex"
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  my={2}
                >
                  <Typography>multiple:</Typography>
                  <TextField
                    // sx={{ width: "100px" }}
                    name="multiple"
                    onChange={handleOnChangeStrategy}
                    type="string"
                    value={strategy.multiple}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="standard"
                  />
                </Box>
                <Box
                  display="flex"
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  my={2}
                >
                  <Typography>precision:</Typography>
                  <TextField
                    // sx={{ width: "100px" }}
                    name="precision"
                    onChange={handleOnChangeStrategy}
                    type="string"
                    value={strategy.precision}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="standard"
                  />
                </Box>
                <Box
                  display="flex"
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  my={2}
                >
                  <Typography>swap amount (token amount)</Typography>
                  <TextField
                    // sx={{ width: "100px" }}
                    name="swapAmount"
                    onChange={handleOnChangeStrategy}
                    type="string"
                    value={strategy.swapAmount}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="standard"
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          </Fragment>
        ) : (
          "loading"
        )}
      </DialogContent>
      <DialogActions sx={{ width: "100%", background: "#1e2026" }}>
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          py={1}
          gap={16}
          px="16px"
        >
          {alertMsg.message ? (
            <Alert
              severity={alertMsg.severity === "success" ? "success" : "error"}
            >
              <Typography fontSize="14px">{alertMsg.message}</Typography>
            </Alert>
          ) : (
            <Box />
          )}
          <LoadingButton
            startIcon={<DriveFileRenameOutlineIcon />}
            variant="contained"
            loading={loading}
            onClick={handleSubmit}
          >
            Update
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default UpdateStrategyDialog;
