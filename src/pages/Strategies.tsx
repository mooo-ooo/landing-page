import { type FC, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  IconButton,
  TableCell as TableCellMui,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  TableContainer
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PausePresentationIcon from "@mui/icons-material/PausePresentation";
import { styled } from "@mui/system";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import numeral from "numeral";
import type { AppDispatch } from "../redux/store";
import {
  fetchStrategies,
  selectStrategies,
} from "../redux/strategy/strategySlice";
import { useSnackbar } from "notistack";

import {
  setUpdateStrategy,
  setNewStrategy,
  type IStrategy,
} from "../redux/strategy/strategySlice";
import api from "../lib/axios";

const Strategies: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch<AppDispatch>();
  const strategies = useSelector(selectStrategies);

  const [bots, setBots] = useState<
    { status: string, name: string; id: string; monit: { cpu: number; memory: number } }[]
  >([]);

  const fetchBots = () => {
    api.get("/api/v1/bot-master").then(async ({ data }) => {
      setBots(data);
    });
  };
  useEffect(() => {
    fetchBots();
  }, [strategies]);
  useEffect(() => {
    dispatch(fetchStrategies());
    fetchBots();
  }, []);
  const handleRemoveStrategy = (id: string) => {
    api.delete(`/api/v1/strategies?_id=${id}`).then(() => {
      dispatch(fetchStrategies());
      enqueueSnackbar(`Removed successfully`, { variant: "success" });
    });
  };
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box mb={4}>
        <Typography mb={2}>Your Bots</Typography>
        <TableContainer component={Paper} elevation={4}>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="PM2 Strategy Monitoring Dashboard Mockup"
          >
            <TableHead sx={{ bgcolor: "#3f51b5" }}>
              <TableRow>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Name
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  PM2 ID
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Status
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  CPU
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Memory
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: "white", fontWeight: "bold" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bots.map(({id, monit: {cpu, memory}, name, status }) => {
                return (
                  <TableRow
                    key={id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "medium" }}
                    >
                      {name.split('-')[1]}
                    </TableCell>
                    <TableCell>{id}</TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {cpu.toFixed(1)}%
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {Math.round(memory / (1024 * 1024))} MB
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleRemoveStrategy(id)}
                        size="small"
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        <DeleteForeverIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box display="flex" alignItems="center">
        <Typography>Your Strategies</Typography>
        <IconButton
          onClick={() =>
            dispatch(setNewStrategy({ open: true, baseToken: "" }))
          }
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": { color: "primary.main" },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          mb: 2,
          backgroundColor: "#010409",
          border: "1px solid #30363d",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ height: "48px" }}>
              <TableCell align="left">
                <Typography color="textSecondary">Name</Typography>
              </TableCell>
              <TableCell align="left">
                <Typography color="textSecondary">Exchanges</Typography>
              </TableCell>
              <TableCell align="left">
                <Typography color="textSecondary">Symbol</Typography>
              </TableCell>
              <TableCell align="left">
                <Typography color="textSecondary">Open Spread Rate</Typography>
              </TableCell>
              <TableCell align="left">
                <Typography color="textSecondary">Close Spread Rate</Typography>
              </TableCell>
              <TableCell align="left">
                <Typography color="textSecondary">Max vol (order)</Typography>
              </TableCell>

              <TableCell align="left">
                <Typography color="textSecondary">
                  Max vol (strategy)
                </Typography>
              </TableCell>
              <TableCell align="left">
                <Typography color="textSecondary">Direction</Typography>
              </TableCell>
              <TableCell align="left">
                <MoreVertIcon />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {strategies.map((strategy) => (
              <StrategyRow
                strategy={strategy}
                key={strategy._id}
                handleRemoveStrategy={handleRemoveStrategy}
              />
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Strategies;

const StrategyRow = ({
  strategy,
  handleRemoveStrategy,
}: {
  strategy: IStrategy;
  handleRemoveStrategy: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const {
    strategyName,
    sellExchange,
    buyExchange,
    sellSymbol,
    buySymbol,
    _id,
    bestInSpread,
    secondInSpread,
    bestOutSpread,
    secondOutSpread,
    maxOrderVol,
    maxVolOfPosition,
    isIncrease,
    isReduce,
    requiredOrderVol,
  } = strategy;

  const isStopped = !isIncrease && !isReduce;

  const baseToken = sellSymbol.split("/")[0];
  const dispatch = useDispatch<AppDispatch>();

  // const handleOk = (strategyName: string) => {
  //   api.post("/api/v1/bot-master", {strategyName}).then(async () => {
  //     dispatch(fetchStrategies());
  //     setOpen(false);
  //   });
  // };
  return (
    <TableRow key={_id}>
      <TableCell>
        {strategyName}
      </TableCell>
      <TableCell>
        <Typography
          sx={{
            color: "rgb(246, 70, 93)",
          }}
        >
          {sellExchange}
        </Typography>
        <Typography
          sx={{
            color: "rgb(14, 203, 129)",
          }}
        >
          {buyExchange}
        </Typography>
      </TableCell>
      <TableCell>
        {buySymbol === sellSymbol ? buySymbol : `${sellSymbol}/${buySymbol}`}
      </TableCell>
      <TableCell>
        {bestInSpread}% | {secondInSpread}%
      </TableCell>
      <TableCell>
        {bestOutSpread}% | {secondOutSpread}%
      </TableCell>
      <TableCell>{maxOrderVol}</TableCell>

      <TableCell>{numeral(maxVolOfPosition).format("0,0.[000]")}</TableCell>
      <TableCell>
        {isStopped ? (
          <PausePresentationIcon sx={{ color: "rgb(246, 70, 93)" }} />
        ) : isIncrease ? (
          <TrendingUpIcon sx={{ color: "rgb(14, 203, 129)" }} />
        ) : (
          <TrendingDownIcon sx={{ color: "rgb(246, 70, 93)" }} />
        )}
      </TableCell>
      <TableCell>
        <IconButton
          onClick={() => dispatch(setUpdateStrategy({ open: true, baseToken }))}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": { color: "primary.main" },
          }}
        >
          <DriveFileRenameOutlineIcon />
        </IconButton>
        <IconButton
          onClick={() => handleRemoveStrategy(_id)}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": { color: "primary.main" },
          }}
        >
          <DeleteForeverIcon />
        </IconButton>
      </TableCell>
      <Dialog
        sx={{ "& .MuiDialog-paper": { width: "80%", maxHeight: 435 } }}
        maxWidth="xs"
        open={open}
      >
        <DialogTitle>Confirmation Strategy</DialogTitle>
        <DialogContent dividers>
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
            <Typography>{strategyName}</Typography>
          </Box>
          <Box height={16} />
          {isReduce ? (
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
                [{bestOutSpread} | {secondOutSpread}]
              </Typography>
            </Box>
          ) : null}
          {isStopped ? (
            <Typography
              sx={{
                alignItems: "center",
                width: "100%",
                justifyContent: "space-between",
                padding: 2,
                background: "rgb(246 70 93 / 10%)",
              }}
            >
              Stop this strategy
            </Typography>
          ) : null}
          {isIncrease ? (
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
              <Typography>
                [{bestInSpread} | {secondInSpread}]
              </Typography>
            </Box>
          ) : null}
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
            <Typography>Max vol of strategy (USDT)</Typography>
            <Typography>
              {numeral(maxVolOfPosition).format("0,0.[000]")}
            </Typography>
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
            <Typography>Max vol per order (USDT)</Typography>
            <Typography>{maxOrderVol}</Typography>
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
            <Typography>{requiredOrderVol}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {/* <Button onClick={handleOk}>Ok</Button> */}
        </DialogActions>
      </Dialog>
    </TableRow>
  );
};

const TableCell = styled(TableCellMui)(() => ({
  padding: "6px 16px",
}));

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, {bgColor: string, textColor: string}> = {
    online: { bgColor: "#e8f5e9", textColor: "#2e7d32" }, // Light Green
    stopped: { bgColor: "#ffebee", textColor: "#c62828" }, // Light Red
    stopping: { bgColor: "#fff3e0", textColor: "#ef6c00" }, // Light Orange
    launching: { bgColor: "#e3f2fd", textColor: "#1565c0" }, // Light Blue
  };
  const { bgColor, textColor } = colorMap[status] || {
    bgColor: "#f5f5f5",
    textColor: "#616161",
  };

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.7,
        py: 0.2,
        borderRadius: 2,
        fontSize: "0.75rem",
        fontWeight: 500,
        bgcolor: bgColor,
        color: textColor,
        border: `1px solid ${textColor}`,
        transition: "all 0.15s",
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          mr: 0.5,
          borderRadius: "50%",
          bgcolor: "currentColor",
        }}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Box>
  );
};