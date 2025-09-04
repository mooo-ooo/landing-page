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
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PausePresentationIcon from "@mui/icons-material/PausePresentation";
import SlowMotionVideoIcon from "@mui/icons-material/SlowMotionVideo";
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
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import {
  setUpdateStrategy,
  setNewStrategy,
  type IStrategy,
} from "../redux/strategy/strategySlice";
import api from "../lib/axios";

const ItemTypes = {
  BOX: "box",
};

interface DropResult {
  id: string;
}

const Strategies: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch<AppDispatch>();
  const strategies = useSelector(selectStrategies);

  const [bots, setBots] = useState<{ _id: string; strategyId: string }[]>([]);

  const fetchBots = () => {
    api.get("/api/v1/botorders").then(async ({ data }) => {
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
      <DndProvider backend={HTML5Backend}>
        <Box mb={4}>
          <Typography mb={2}>Your Bots</Typography>
          <Box>
            {bots.map((bot) => {
              const strategy = strategies.find((strategy) => {
                return strategy._id === bot.strategyId;
              });
              return <BotItem key={bot._id} strategy={strategy} bot={bot} />;
            })}
          </Box>
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
                  <Typography color="textSecondary">
                    Open Spread Rate
                  </Typography>
                </TableCell>
                <TableCell align="left">
                  <Typography color="textSecondary">
                    Close Spread Rate
                  </Typography>
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
      </DndProvider>
    </Box>
  );
};

export default Strategies;

const BotItem = ({
  bot,
  strategy,
}: {
  bot: { _id: string; strategyId: string };
  strategy?: IStrategy;
}) => {
  const { isIncrease, isReduce } = strategy || {};
  const isStopped = !isIncrease && !isReduce;
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.BOX,
    drop: () => ({ id: bot._id }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));
  const isActive = canDrop && isOver;
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Card
      ref={drop}
      key={bot._id}
      sx={{
        p: 2,
        width: "30%",
        backgroundImage: isActive
          ? `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='1' ry='1' stroke='grey' stroke-width='7' stroke-dasharray='18%2c 14%2c 18%2c 22' stroke-dashoffset='28' stroke-linecap='square'/%3e%3c/svg%3e");
border-radius: 1px;`
          : null,
      }}
    >
      <Box display="flex" justifyContent="space-between" flexDirection="row">
        <Box>
          <Typography color="textSecondary">Id: {bot._id}</Typography>
          <Box height={6} />
          <Box display="flex" gap={2}>
            {isStopped ? (
              <PausePresentationIcon
                sx={{ color: "rgb(246, 70, 93)", fontSize: 24 }}
              />
            ) : isIncrease ? (
              <TrendingUpIcon
                sx={{ color: "rgb(14, 203, 129)", fontSize: 24 }}
              />
            ) : (
              <TrendingDownIcon
                sx={{ color: "rgb(246, 70, 93)", fontSize: 24 }}
              />
            )}
            <Typography fontSize={16} fontWeight="bold">
              {strategy?.strategyName}
            </Typography>
          </Box>
        </Box>
        <Box>
          <SlowMotionVideoIcon
            sx={{ fontSize: 36, fill: "rgb(14, 203, 129)" }}
            className="blinking-icon"
          />
        </Box>
      </Box>

      <Box height={6} />
    </Card>
  );
};

const StrategyRow = ({
  strategy,
  handleRemoveStrategy,
}: {
  strategy: IStrategy;
  handleRemoveStrategy: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [updatedRequest, setUpdatedRequest] = useState<{
    _id: string;
    strategyId: string;
  }>();
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
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BOX,
    item: { _id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (item && dropResult) {
        setOpen(true);
        setUpdatedRequest({
          _id: dropResult.id,
          strategyId: item._id,
        });
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));
  const baseToken = sellSymbol.split("/")[0];
  const dispatch = useDispatch<AppDispatch>();

  const handleOk = () => {
    api.put("/api/v1/botorders", updatedRequest).then(async () => {
      dispatch(fetchStrategies());
      setOpen(false);
    });
  };

  const opacity = isDragging ? 0.4 : 1;
  return (
    <TableRow key={_id} sx={{ opacity }}>
      <TableCell>
        <div
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ref={drag}
          style={{
            cursor: "move",
            textAlign: "center",
            lineHeight: "36px",
          }}
        >
          {strategyName}
        </div>
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
          <Button onClick={handleOk}>Ok</Button>
        </DialogActions>
      </Dialog>
    </TableRow>
  );
};

const TableCell = styled(TableCellMui)(() => ({
  padding: "6px 16px",
}));
