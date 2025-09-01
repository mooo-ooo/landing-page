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
} from "@mui/material";
import { styled } from "@mui/system";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch } from "react-redux";
import numeral from "numeral";
import type { AppDispatch } from "../redux/store";
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
  const [strategies, setStrategies] = useState<IStrategy[]>([]);
  const [bots, setBots] = useState<{ _id: string; strategyId: string }[]>([]);

  const fetchStrategies = () => {
    api.get("/api/v1/strategies").then(({ data }) => {
      setStrategies(data);
    });

    api.get("/api/v1/botorders").then(async ({ data }) => {
      setBots(data);
    });
  };
  useEffect(() => {
    fetchStrategies();
  }, []);
  const handleRemoveStrategy = (id: string) => {
    api.delete(`/api/v1/strategies?_id=${id}`).then(() => {
      fetchStrategies();
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
              return <BotItem strategy={strategy} bot={bot} />;
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
                  <Typography color="textSecondary">Sell Exchange</Typography>
                </TableCell>
                <TableCell align="left">
                  <Typography color="textSecondary">Buy Exchange</Typography>
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
                  <Typography color="textSecondary">
                    Max vol per order
                  </Typography>
                </TableCell>
                <TableCell align="left">
                  <Typography color="textSecondary">Max vol</Typography>
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
                  handleRemoveStrategy={handleRemoveStrategy}
                  fetchStrategies={fetchStrategies}
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
      sx={{
        p: 2,
        width: "30%",
        border: isActive
          ? "1px solid #ffa726"
          : "1px solid #121212",
      }}
    >
      <Typography color="textSecondary">Id: {bot._id}</Typography>
      <Box height={6} />
      <Typography>Strategy: {strategy?.strategyName}</Typography>
      <Box height={6} />
    </Card>
  );
};

const StrategyRow = ({
  strategy,
  handleRemoveStrategy,
  fetchStrategies,
}: {
  strategy: IStrategy;
  handleRemoveStrategy: (id: string) => void;
  fetchStrategies: () => void;
}) => {
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
  } = strategy;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.BOX,
    item: { _id },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (item && dropResult) {
        api
          .put("/api/v1/botorders", {
            _id: dropResult.id,
            strategyId: item._id,
          })
          .then(async () => {
            fetchStrategies();
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

  const opacity = isDragging ? 0.4 : 1;
  return (
    <TableRow key={_id} sx={{ opacity }}>
      <TableCell>
        <div
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ref={drag}
          style={{ cursor: "move", textAlign: "center", lineHeight: "36px" }}
        >
          {strategyName}
        </div>
      </TableCell>
      <TableCell
        sx={{
          color: "rgb(246, 70, 93)",
        }}
      >
        [{sellExchange.toUpperCase()}] {sellSymbol}
      </TableCell>
      <TableCell
        sx={{
          color: "rgb(14, 203, 129)",
        }}
      >
        [{buyExchange.toUpperCase()}] {buySymbol}
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
    </TableRow>
  );
};

const TableCell = styled(TableCellMui)(() => ({
  padding: "6px 16px",
}));
