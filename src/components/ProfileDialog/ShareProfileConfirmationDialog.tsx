import { useState, Fragment } from "react";
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
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import CloseIcon from "@mui/icons-material/Close";
import LoadingButton from "@mui/lab/LoadingButton";
import { useSnackbar } from "notistack";
import { fetchGroup } from "../../redux/group/groupSlice";
import type { AppDispatch } from "../../redux/store";
import { useDispatch } from "react-redux";
import api from "../../lib/axios";

export interface NewStrategyProps {
  allowed: boolean;
  open: boolean;
  onClose: () => void;
}

function ShareProfileConfirmationDialog(props: NewStrategyProps) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { allowed, onClose, open } = props;
  const [token, setToken] = useState("");

  const handleChangeToken = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToken(event.target.value);
  };
  const { enqueueSnackbar } = useSnackbar();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);


  const handleSubmit = async () => {
    setLoading(true);
    api
      .put("/api/v1/groups/me", {
        isAllowedSharePortfolio: allowed,
        type: "share-portfolio",
        token
      })
      .then(() => {
        enqueueSnackbar(`Updated profile sharing settings`, {
          variant: "success",
        });
        dispatch(fetchGroup());
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
      .finally(() => {
        setToken("");
        setLoading(false);
      });
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      sx={{ "& .MuiDialog-paper": { width: "650px" } }}
      maxWidth="xl"
      open={open}
    >
      <DialogTitle sx={{ fontSize: 16, background: "#1e2026" }}>
        Confirm to {allowed ? "share" : "stop sharing"} profile
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
          <Typography variant="body1" gutterBottom>
            Are you sure you want to {allowed ? "share" : "stop sharing"} your profile information with others?
          </Typography>
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

export default ShareProfileConfirmationDialog;
