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
  Button,
  TableContainer,
  TableFooter,
  Tooltip,
  TextField,
  Card,
  Grid,
  CardContent,
} from "@mui/material";
import {
  TablePagination,
  tablePaginationClasses as classes,
} from "@mui/base/TablePagination";
import { removeHeadSegment } from "../helpers";
import useMediaQuery from "@mui/material/useMediaQuery";
import SearchIcon from "@mui/icons-material/Search";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
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
import { selectGroup } from "../redux/group/groupSlice";
import { useSnackbar } from "notistack";

import {
  setUpdateStrategy,
  setNewStrategy,
  setLaunchStrategy,
  type IStrategy,
} from "../redux/strategy/strategySlice";
import api from "../lib/axios";

interface IBot {
  status: string;
  name: string;
  id: string;
  monit: { cpu: number; memory: number };
}

const Strategies: FC = () => {
  const isWeb = useMediaQuery("(min-width:600px)");
  const groupStore = useSelector(selectGroup);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchToken, setSearchToken] = useState("");
  const [page, setPage] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch<AppDispatch>();
  const strategies = useSelector(selectStrategies);

  const [bots, setBots] = useState<IBot[]>([]);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchBots = () => {
    if (groupStore.botMasterBaseUrl) {
      api.get("/api/v1/bot-master").then(async ({ data }) => {
        setBots(
          data.map((item: IBot) => {
            return {
              ...item,
              name: removeHeadSegment(item.name),
            };
          })
        );
      });
    }
  };
  useEffect(() => {
    fetchBots();
  }, [strategies]);

  useEffect(() => {
    if (groupStore._id) {
      dispatch(fetchStrategies());
    }
  }, [groupStore]);
  
  const handleRemoveStrategy = (id: string) => {
    api.delete(`/api/v1/strategies?_id=${id}`).then(() => {
      dispatch(fetchStrategies());
      enqueueSnackbar(`Removed successfully`, { variant: "success" });
    }).catch(() => {
      enqueueSnackbar(`Something went wrong`, { variant: "error" });
    });
  };

  const handleRemoveBot = (strategyName: string) => {
    api.delete(`/api/v1/bot-master/${strategyName}`).then(() => {
      fetchBots();
      enqueueSnackbar(`Removed ${strategyName} successfully`, {
        variant: "success",
      });
    }).catch(() => {
      enqueueSnackbar(`Something went wrong`, { variant: "error" });
    });
  };

  const displayedStrategies =
    rowsPerPage > 0
      ? strategies
          .filter((strategy) =>
            strategy.strategyName.includes(searchToken.toUpperCase())
          )
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      : strategies;
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box mt={1}>
        <Typography variant="h4" component="h1" gutterBottom>
          Strategy management Hub
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Monitor, launch, and configure your currently deployed market-making
          and arbitrage algorithms across integrated exchanges.
        </Typography>
      </Box>
      {bots?.length ? (
        <Box mb={4}>
          <Typography my={2} color="textSecondary">
            Your running Bots
          </Typography>
          <TableContainer component={Paper} elevation={4}>
            <Table
              sx={{ background: "rgba(0,0,0,0.12)" }}
              aria-label="PM2 Strategy Monitoring Dashboard Mockup"
            >
              <TableHead sx={{ height: "36px" }}>
                {isWeb ? (
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
                ) : (
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Name
                    </TableCell>

                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Status
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {bots.map(({ id, monit: { cpu, memory }, name, status }) => {
                  if (!isWeb) {
                    return (
                      <TableRow
                        key={id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{ fontWeight: "medium" }}
                        >
                          {name}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>

                        <TableCell align="right">
                          <IconButton
                            onClick={() =>
                              handleRemoveBot(name.toUpperCase())
                            }
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
                  }
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
                        {name}
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
                          onClick={() =>
                            handleRemoveBot(name)
                          }
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
      ) : null}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
      >
        {/* 1. Search Token Input */}
        <TextField
          variant="outlined"
          placeholder={isWeb ? "Search tokens (e.g., DOGE)" : "Search token"}
          size="small"
          value={searchToken}
          onChange={(e) => setSearchToken(e.target.value)}
          InputProps={{
            // Light blue icon
            startAdornment: <SearchIcon sx={{ color: "#90CAF9", mr: 1 }} />,
          }}
          sx={{ width: isWeb ? "300px" : "200px" }} // Give it a fixed width
        />

        {/* 2. Add New Strategy Button (Primary CTA) */}
        <Button
          variant="contained"
          color="primary" // Use MUI primary color (blue) or custom green for high visibility
          startIcon={<AddIcon />}
          onClick={() =>
            dispatch(setNewStrategy({ open: true, baseToken: "" }))
          }
        >
          {isWeb ? "Add New Strategy" : "New"}
        </Button>
      </Box>
      {isWeb ? (
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
                  <Typography color="textSecondary">Max vol (order)</Typography>
                </TableCell>

                <TableCell align="left">
                  <Typography color="textSecondary">
                    Max vol (positions)
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
              {displayedStrategies.map((strategy) => (
                <StrategyRow
                  strategy={strategy}
                  key={strategy._id}
                  handleRemoveStrategy={handleRemoveStrategy}
                />
              ))}
            </TableBody>
            <TableFooter>
              <tr>
                <CustomTablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={5}
                  count={strategies.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  slotProps={{
                    select: {
                      "aria-label": "rows per page",
                    },
                    actions: {
                      showFirstButton: true,
                      showLastButton: true,
                    },
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </tr>
            </TableFooter>
          </Table>
        </Paper>
      ) : (
        displayedStrategies.map((strategy) => (
          <StrategyCard
            strategy={strategy}
            handleRemoveStrategy={handleRemoveStrategy}
          />
        ))
      )}
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
  const {
    strategyName,
    sellExchange,
    buyExchange,
    sellSymbol,
    buySymbol,
    _id,
    maxOrderVol,
    maxVolOfPosition,
    isIncrease,
  } = strategy;

  const dispatch = useDispatch<AppDispatch>();

  return (
    <TableRow key={_id}>
      <TableCell>{strategyName}</TableCell>
      <TableCell>
        <Box display="flex" width="100%" alignItems="center" gap={1}>
          <img
            style={{
              borderRadius: "50%",
            }}
            src={`/${sellExchange}.png`}
            alt="USDT"
            width={16}
            height={16}
          />
          <Typography
            sx={{
              color: "rgb(246, 70, 93)",
            }}
          >
            {sellExchange}
          </Typography>
        </Box>
        <Box height={12} />
        <Box display="flex" width="100%" alignItems="center" gap={1}>
          <img
            style={{
              borderRadius: "50%",
            }}
            src={`/${buyExchange}.png`}
            alt="USDT"
            width={16}
            height={16}
          />
          <Typography
            sx={{
              color: "rgb(14, 203, 129)",
            }}
          >
            {buyExchange}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        {buySymbol === sellSymbol ? buySymbol : `${sellSymbol}/${buySymbol}`}
      </TableCell>
      <TableCell>{maxOrderVol}</TableCell>

      <TableCell>{numeral(maxVolOfPosition).format("0,0.[000]")}</TableCell>
      <TableCell>
        {isIncrease ? (
          <TrendingUpIcon sx={{ color: "rgb(14, 203, 129)" }} />
        ) : (
          <TrendingDownIcon sx={{ color: "rgb(246, 70, 93)" }} />
        )}
      </TableCell>
      <TableCell>
        <Box display="flex" gap={2}>
          <Tooltip title="Launch">
            <IconButton
              onClick={() => {
                dispatch(
                  setLaunchStrategy({ open: true, baseToken: strategyName })
                );
              }}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <RocketLaunchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Update">
            <IconButton
              onClick={() =>
                dispatch(
                  setUpdateStrategy({ open: true, baseToken: strategyName })
                )
              }
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <DriveFileRenameOutlineIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
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
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
};

const StrategyCard = ({
  strategy,
  handleRemoveStrategy,
}: {
  strategy: IStrategy;
  handleRemoveStrategy: (id: string) => void;
}) => {
  const {
    strategyName,
    sellExchange,
    buyExchange,
    sellSymbol,
    buySymbol,
    _id,
    maxOrderVol,
    maxVolOfPosition,
    isIncrease,
  } = strategy;

  const dispatch = useDispatch<AppDispatch>();
  return (
    <Card sx={{ mb: 0.5, borderLeft: `4px solid rgba(81, 81, 81, 1)` }}>
      <CardContent>
        <Grid container spacing={1}>
          {/* Row 1: Name and Max Vol (Order) */}
          <Grid size={6}>
            <Box display="flex" gap={1}>
              {isIncrease ? (
                <TrendingUpIcon sx={{ color: "rgb(14, 203, 129)" }} />
              ) : (
                <TrendingDownIcon sx={{ color: "rgb(246, 70, 93)" }} />
              )}
              <Typography variant="subtitle1" fontWeight="bold">
                {strategyName}
              </Typography>
            </Box>
          </Grid>
          <Grid size={6} textAlign="right">
            <Typography variant="body2">
              Max vol (order): {maxOrderVol}
            </Typography>
          </Grid>

          {/* Row 2: Symbol and Max Vol (Positions) */}
          <Grid size={6}>
            <Typography variant="body2">
              {buySymbol === sellSymbol
                ? buySymbol
                : `${sellSymbol}/${buySymbol}`}
            </Typography>
          </Grid>
          <Grid size={6} textAlign="right">
            <Typography variant="body2">
              Max vol (Pos): {numeral(maxVolOfPosition).format("0,0.[000]")}
            </Typography>
          </Grid>

          {/* Row 3: Exchanges and Direction/Actions */}
          <Grid size={6} sx={{ mt: 1 }}>
            <Typography variant="caption" display="block">
              Exchanges:
            </Typography>
            <Box display="flex" width="100%" alignItems="center" gap={1}>
              <img
                style={{
                  borderRadius: "50%",
                }}
                src={`/${sellExchange}.png`}
                alt="USDT"
                width={14}
                height={14}
              />
              <Typography
                sx={{
                  color: "rgb(246, 70, 93)",
                }}
              >
                {sellExchange}
              </Typography>
            </Box>
            <Box height={12} />
            <Box display="flex" width="100%" alignItems="center" gap={1}>
              <img
                style={{
                  borderRadius: "50%",
                }}
                src={`/${buyExchange}.png`}
                alt="USDT"
                width={14}
                height={14}
              />
              <Typography
                sx={{
                  color: "rgb(14, 203, 129)",
                }}
              >
                {buyExchange}
              </Typography>
            </Box>
            {/* Status indicator can go here or be part of the title */}
          </Grid>

          {/* Action Icons */}
          <Grid size={6} textAlign="right" sx={{ mt: 1 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="caption" display="block">
                Actions:
              </Typography>
              <Box>
                <Tooltip title="Launch">
                  <IconButton
                    onClick={() => {
                      dispatch(
                        setLaunchStrategy({
                          open: true,
                          baseToken: strategyName,
                        })
                      );
                    }}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <RocketLaunchIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Update">
                  <IconButton
                    onClick={() =>
                      dispatch(
                        setUpdateStrategy({
                          open: true,
                          baseToken: strategyName,
                        })
                      )
                    }
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <DriveFileRenameOutlineIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete">
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
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const TableCell = styled(TableCellMui)(() => ({
  padding: "6px 16px",
}));

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, { bgColor: string; textColor: string }> = {
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

const CustomTablePagination = styled(TablePagination)`
  & .${classes.toolbar} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 16px;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
    }
  }

  & .${classes.selectLabel} {
    margin: 0;
  }

  & .${classes.displayedRows} {
    margin: 0;

    @media (min-width: 768px) {
      margin-left: auto;
    }
  }

  & .${classes.spacer} {
    display: none;
  }

  & .${classes.actions} {
    display: flex;
    gap: 0.25rem;
    button {
      height: 24px;
    }
  }
  & .${classes.select} {
    height: 24px;
  }
  & .${classes.select} {
    height: 24px;
  }
`;
