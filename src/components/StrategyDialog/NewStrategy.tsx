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
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import LoadingButton from "@mui/lab/LoadingButton";
import { selectBalances } from "../../redux/balances/balancesSlice";
import {
  fetchStrategies,
} from "../../redux/strategy/strategySlice";
import type { AppDispatch } from "../../redux/store";
import { useSelector, useDispatch } from "react-redux";
import api from "../../lib/axios";

export interface NewStrategyProps {
  baseToken?: string;
  open: boolean;
  onClose: () => void;
}

const markPriceBaseUrl =
  "http://178.128.110.139:8080/https://api.mexc.com/api/v3/ticker/price?symbol=";

function NewStrategyDialog(props: NewStrategyProps) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { baseToken, onClose, open } = props;
  const [strategy, setStrategy] = useState<Partial<IStrategy>>({
    strategyName: props.baseToken?.toUpperCase() || "",
    requiredOrderVol: 30,
    secondInSpread: 0,
    bestOutSpread: 0,
    secondOutSpread: 0,
    isIncrease: true,
    isReduce: false,
    sellSymbol: `${baseToken}/USDT:USDT`.toUpperCase(),
    buySymbol: `${baseToken}/USDT:USDT`.toUpperCase(),
    maxVolOfPosition: 0,
    minVolOfPosition: 0,
  });
  const [token, setToken] = useState(baseToken);
  const balances = useSelector(selectBalances);
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({
    severity: "",
    message: "",
  });
  const [markPrice, setMarkPrice] = useState("");
  const exchanges = useMemo(() => {
    return Object.keys(balances);
  }, [balances]);

  const handleOnChangeStrategy = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategy({
      ...strategy,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    if (token) {
      setStrategy((prev) => {
        return {
          ...prev,
          sellSymbol: `${token}/USDT:USDT`.toUpperCase(),
          buySymbol: `${token}/USDT:USDT`.toUpperCase(),
        };
      });
      api
        .get(`${markPriceBaseUrl}${token}USDT`)
        .then(function ({ data: { price } }) {
          setMarkPrice(price);
          if (Number(price) > 50) {
            setStrategy((prev) => {
              return {
                ...prev,
                precision: estimatePrecision(Number(price)),
                multiple: 0,
              };
            });
          } else {
            setStrategy((prev) => {
              return {
                ...prev,
                multiple: estimateMultiple(Number(price)),
                precision: 0,
              };
            });
          }
        });
    }
  }, [token]);

  const handleSubmit = async () => {
    setLoading(true);
    api
      .post("/api/v1/strategies", strategy)
      .then(() => {
        setAlertMsg({
          severity: "success",
          message: "Strategy created successfully",
        });
        setTimeout(() => {
          onClose()
        }, 3000);
        dispatch(fetchStrategies());
      })
      .catch((err) => {
        console.log(err);
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
      <DialogTitle sx={{ fontSize: 16 }}>
        New Strategy: {baseToken} - mark price: {markPrice} USDT
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
          background: "#121212",
          paddingBottom: "32px",
        }}
      >
        <Fragment>
          {baseToken ? null : (
            <Box display="flex" width="100%" flexDirection="column" mb={2}>
              <Typography>Base Token</Typography>
              <TextField
                name="token"
                fullWidth
                size="small"
                onChange={(e) => {
                  setToken(e.target.value);
                }}
                type="string"
                value={token}
                InputLabelProps={{
                  shrink: true,
                }}
                variant="outlined"
              />
              <Typography color="textSecondary" fontSize={12}>
                Enter the base token
              </Typography>
            </Box>
          )}
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
              <FormControlLabel value="open" control={<Radio />} label="Open" />
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
                Volumn = tokenAmount * markPrice (buy + sell)
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
            </AccordionDetails>
          </Accordion>
        </Fragment>
      </DialogContent>
      <DialogActions sx={{ width: "100%", background: "#121212" }}>
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
            startIcon={<AddIcon />}
            variant="contained"
            loading={loading}
            onClick={handleSubmit}
          >
            Add
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default NewStrategyDialog;

const estimatePrecision = (price: number) => {
  if (price > 50000) {
    return 3;
  }
  if (price > 1000) {
    return 2;
  }
  return 1;
};

const estimateMultiple = (price: number): number => {
  // Start with a multiple of 1.
  let multiple = 1;

  // Loop until the condition price * multiple >= 1 is met.
  // In each iteration, multiply the multiple by 10.
  while (price * multiple < 1) {
    multiple *= 10;
  }

  return multiple;
};
