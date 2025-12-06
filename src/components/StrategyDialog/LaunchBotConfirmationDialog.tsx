import { useState, useEffect, Fragment } from "react";
import { AxiosError } from "axios";
import {
  Box,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Typography,
  IconButton,
  TextField,
} from "@mui/material";
import type { IStrategy } from "../../redux/strategy/strategySlice";
import { useTheme } from "@mui/material/styles";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import useMediaQuery from "@mui/material/useMediaQuery";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CloseIcon from "@mui/icons-material/Close";
import LoadingButton from "@mui/lab/LoadingButton";
import numeral from "numeral";
import { useSnackbar } from "notistack";
import { fetchStrategies } from "../../redux/strategy/strategySlice";
import type { AppDispatch } from "../../redux/store";
import { useDispatch } from "react-redux";
import api from "../../lib/axios";

export interface NewStrategyProps {
  baseToken?: string;
  open: boolean;
  onClose: () => void;
}

function LaunchBotConfirmationDialog(props: NewStrategyProps) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { baseToken, onClose, open } = props;
  const [token, setToken] = useState("");

  const handleChangeToken = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToken(event.target.value);
  };
  const { enqueueSnackbar } = useSnackbar();
  const [strategy, setStrategy] = useState<Partial<IStrategy>>({});
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchStrategies())
      .unwrap()
      .then((res: IStrategy[]) => {
        setStrategy(
          res.find(
            ({ strategyName }) =>
              baseToken?.toLowerCase() === strategyName.toLowerCase()
          )!
        );
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseToken]);

  const handleSubmit = async () => {
    setLoading(true);
    api
      .post("/api/v1/bot-master", {
        strategyName: strategy.strategyName,
        token,
      })
      .then(() => {
        enqueueSnackbar(`Launch ${strategy.strategyName} successfully`, {
          variant: "success",
        });
        dispatch(fetchStrategies());
        onClose();
      })
      .catch((err) => {
        if (err instanceof AxiosError) {
          enqueueSnackbar(err.response?.data?.message || "Failed to launch bot", {
            variant: "error",
          });
        } else {
          enqueueSnackbar("An unexpected error occurred", {
            variant: "error",
          });
        }
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
        Review and launch your Bot
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
        <Fragment>
          <Box
            display="flex"
            flexDirection="row"
            sx={{
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Typography>Strategy name</Typography>
            <Typography>{strategy.strategyName}</Typography>
          </Box>
          <Box height={16} />
          {strategy.isReduce ? (
            <Box
              display="flex"
              flexDirection="row"
              sx={{
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
                padding: 2,
                background: "rgb(246 70 93 / 10%)",
              }}
            >
              <Typography>Close</Typography>
              <Typography>
                [{strategy.bestOutSpread} | {strategy.secondOutSpread}]
              </Typography>
            </Box>
          ) : null}
          {strategy.isIncrease ? (
            <Box
              display="flex"
              flexDirection="row"
              sx={{
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
                padding: 2,
                background: "rgb(14 203 129 / 10%)",
              }}
            >
              <Typography>Open</Typography>
              <Box display="flex" gap={1}>
                <Typography>{strategy.bestInSpread}%</Typography>
                <ArrowRightAltIcon />
                <Typography>{strategy.secondInSpread}%</Typography>
              </Box>
            </Box>
          ) : null}
          <Box height={16} />
          {strategy.isReduce ? (
            <Box
              display="flex"
              flexDirection="row"
              sx={{
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Typography>Min vol of strategy (USDT) (2 sides)</Typography>
              <Typography>
                {numeral((strategy?.minVolOfPosition || 0) * 2).format(
                  "0,0.[000]"
                )}
              </Typography>
            </Box>
          ) : (
            <Box
              display="flex"
              flexDirection="row"
              sx={{
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Typography>Max vol of strategy (USDT) (2 sides)</Typography>
              <Typography>
                {numeral((strategy?.maxVolOfPosition || 0) * 2).format(
                  "0,0.[000]"
                )}
              </Typography>
            </Box>
          )}
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
            <Typography>Max vol per order (USDT)</Typography>
            <Typography>{strategy.maxOrderVol}</Typography>
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
            <Typography>Required vol per order (USDT)</Typography>
            <Typography>{strategy.requiredOrderVol}</Typography>
          </Box>
        </Fragment>
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
          <TextField
            label="2FA Code"
            name="token"
            value={token}
            onChange={handleChangeToken}
            required
            sx={{ mb: 2 }}
            placeholder="Enter code from your authenticator app"
            inputProps={{
              maxLength: 6,
              pattern: "[0-9]*",
              inputMode: "numeric",
            }}
          />
          <LoadingButton
            startIcon={<RocketLaunchIcon />}
            variant="contained"
            disabled={token.length !== 6}
            loading={loading}
            onClick={handleSubmit}
          >
            Confirm
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default LaunchBotConfirmationDialog;
