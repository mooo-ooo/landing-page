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
  TableCell,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch } from "react-redux";
import numeral from "numeral";
import type { AppDispatch } from "../redux/store";
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
  const [strategies, setStrategies] = useState<IStrategy[]>([]);

  const fetchStrategies = () => {
    api.get("/api/v1/strategies").then(({ data }) => {
      setStrategies(data);
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
          <TableHead
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "#010409",
            }}
          >
            <TableRow sx={{ height: "48px" }}>
              <TableCell align="left">Name</TableCell>
              <TableCell align="left">Sell Exchange</TableCell>
              <TableCell align="left">Buy Exchange</TableCell>
              <TableCell align="left">Open Spread Rate</TableCell>
              <TableCell align="left">Close Spread Rate</TableCell>
              <TableCell align="left">Max vol per order</TableCell>
              <TableCell align="left">Max vol</TableCell>
              <TableCell align="left">
                <MoreVertIcon />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {strategies.map(
              ({
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
              }) => {
                const baseToken = sellSymbol.split("/")[0];
                return (
                  <TableRow key={_id}>
                    <TableCell>{strategyName}</TableCell>
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
                    <TableCell>
                      {numeral(maxVolOfPosition).format("0,0.[000]")}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() =>
                          dispatch(setUpdateStrategy({ open: true, baseToken }))
                        }
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
              }
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Strategies;
