import { useState, useMemo, useEffect } from "react";

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
  FormLabel,
  Select,
  MenuItem,
  Typography,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import type { IStrategy } from "../../redux/strategy/strategySlice";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import LoadingButton from "@mui/lab/LoadingButton";
import { selectBalances } from "../../redux/balances/balancesSlice";
import { useSelector } from "react-redux";

export interface NewStrategyProps {
  baseToken?: string;
  open: boolean;
  onClose: () => void;
}

const markPriceBaseUrl =
  "http://178.128.110.139:8080/https://api.mexc.com/api/v3/ticker/price?symbol=";

function NewStrategyDialog(props: NewStrategyProps) {
  const theme = useTheme();
  const [strategy, setStrategy] = useState<Partial<IStrategy>>({});
  const balances = useSelector(selectBalances);
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { baseToken, onClose, open } = props;
  // const [loading, setLoading] = useState(false);
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
    if (markPrice) {
      if (Number(markPrice) > 50) {
        setStrategy({
          ...strategy,
          precision: estimatePrecision(Number(markPrice)),
        });
      } else {
        setStrategy({
          ...strategy,
          multiple: estimateMultiple(Number(markPrice)),
        });
      }
    }
  }, [markPrice]);

  useEffect(() => {
    if (baseToken) {
      axios
        .get(`${markPriceBaseUrl}${baseToken}USDT`)
        .then(function ({ data }) {
          setMarkPrice(data.price);
        });
    }
  }, [baseToken]);

  const handleBalance = async () => {};

  const strategyInputs = Object.keys(strategy)
    .map((propName) => ({
      ...strategyDetails[propName],
      propName,
    }))
    .sort((a, b) => a.order - b.order);
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
                    sellSymbol: `${e.target.value}/USDT:USDT`.toUpperCase(),
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
                    buySymbol: `${e.target.value}/USDT:USDT`.toUpperCase(),
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
        <FormControl
          sx={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <FormLabel>Direction</FormLabel>
          <RadioGroup
            value={strategy.isReduce ? "close" : "open"}
            row
            onChange={(e) => {
              if (e.target.value === "open") {
                setStrategy({
                  ...strategy,
                  isReduce: false,
                  isIncrease: true,
                });
              } else {
                setStrategy({
                  ...strategy,
                  isReduce: true,
                  isIncrease: false,
                });
              }
            }}
          >
            <FormControlLabel value="open" control={<Radio />} label="Open" />
            <FormControlLabel value="close" control={<Radio />} label="Close" />
          </RadioGroup>
        </FormControl>
        <Box height={16} />
        <Box display="flex" width="100%" flexDirection="column">
          <Typography>Spread rate (%):</Typography>
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
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
            }}
            variant="outlined"
          />
          <Typography color="textSecondary" fontSize={14}>
            Current spread rate 0.1%
          </Typography>
        </Box>
        <Box height={32} />
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
          <Typography color="textSecondary" fontSize={14}>
            Suggested max amount pre order 1000 USDT
          </Typography>
        </Box>
        <Box height={32} />
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
        </Box>

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
            {strategyInputs.map(({ propName, label }) => {
              return (
                <Box
                  key={propName}
                  display="flex"
                  width="100%"
                  justifyContent="space-between"
                  alignItems="center"
                  my={2}
                >
                  <Typography>{label}:</Typography>
                  <TextField
                    // sx={{ width: "100px" }}
                    name={propName}
                    onChange={handleOnChangeStrategy}
                    type="string"
                    value={
                      strategy[propName as unknown as keyof typeof strategy]
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="standard"
                  />
                </Box>
              );
            })}
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions sx={{ width: "100%", background: "#121212" }}>
        <Box
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          py={1}
        >
          {/* <Button autoFocus onClick={null}>
            Run
          </Button> */}
          <LoadingButton
            startIcon={<AddIcon />}
            variant="outlined"
            loading={false}
            onClick={handleBalance}
          >
            Add
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default NewStrategyDialog;

const strategyDetails: Record<string, { order: number; label: string }> = {
  sellExchange: {
    order: 0,
    label: "Sell exchange",
  },
  buyExchange: {
    order: 1,
    label: "Buy exchange",
  },
  sellSymbol: {
    order: 2,
    label: "Sell symbol",
  },
  buySymbol: {
    order: 3,
    label: "Buy symbol",
  },
  precision: {
    order: 10,
    label: "precision",
  },
  multiple: {
    order: 11,
    label: "multiple",
  },
  bestInSpread: {
    order: 4,
    label: "First Open Spread rate",
  },
  secondInSpread: {
    order: 5,
    label: "Second Open Spread rate",
  },
  bestOutSpread: {
    order: 6,
    label: "First Out Spread rate",
  },
  secondOutSpread: {
    order: 7,
    label: "Second Out Spread rate",
  },
  maxOrderVol: {
    order: 8,
    label: "Max amount per order",
  },
  maxVolOfPosition: {
    order: 9,
    label: "Max volumn of this strategy",
  },
  isIncrease: {
    order: 12,
    label: "Open",
  },
  isReduce: {
    order: 13,
    label: "Close",
  },
};

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
