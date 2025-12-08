/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, Fragment } from "react";
import { AxiosError } from "axios";
import {
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell as TableCellMui,
  TableBody,
  Typography,
  InputAdornment,
  Alert,
  AlertTitle,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { convertStringValuesToNumbers, getObjectDiff } from "../../helpers";
import { useNormalizedPositions } from "../../hooks";
import { useSnackbar } from "notistack";
import SaveIcon from "@mui/icons-material/Save";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import numeral from "numeral";
import { green, red, yellow } from "../../constants/colors";
import { useSelector, useDispatch } from "react-redux";
import type { IFuture } from "../../redux/balances/balancesSlice";
import { selectPositions } from "../../redux/positions/positionsSlice";
import { selectGroup, fetchGroup } from "../../redux/group/groupSlice";
import type { AppDispatch } from "../../redux/store";
import { styled } from "@mui/system";
import {
  selectBalances,
  selectBalancesError,
} from "../../redux/balances/balancesSlice";
import api from "../../lib/axios";
import { isEmpty } from "lodash";

type BotType =
  | "force-close"
  | "hedging"
  | "exchange-leverages"
  | "positions"
  | "telegram";

function BotSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const groupStore = useSelector(selectGroup);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const error = useSelector(selectBalancesError);
  const balances = useSelector(selectBalances);
  const positions = useSelector(selectPositions);
  const positionsByBaseToken = useNormalizedPositions([]);
  const [token, setToken] = useState("");
  const [hedgingAmount, setHedgingAmount] = useState(
    groupStore.hedgingAmount.toString()
  );
  const [isBotForceClosingEnabled, setIsBotForceClosingEnabled] = useState(
    Number(groupStore.volumeThreshold) > 0
  );
  const [isBotHedgingEnabled, setIsBotHedgingEnabled] = useState(
    Number(groupStore.hedgingAmount) > 0
  );
  const [volumeThreshold, setVolumeThreshold] = useState(
    groupStore.volumeThreshold?.toString()
  );
  const [tokenLiquidityDistance, settokenLiquidityDistance] = useState(
    groupStore.tokenLiquidityDistance || {}
  );
  const [formExchangeLeverages, setFormExchangeLeverages] = useState<
    Record<string, string>
  >({
    ...groupStore.exchangeLeverages,
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{
    type: BotType;
    changes: Record<string, any>;
  } | null>(null);

  const handleSubmit = async (botType: BotType) => {
    let changes: Record<string, any> = {};

    switch (botType) {
      case "force-close":
        changes = {
          volumeThreshold: Number(volumeThreshold),
        };
        break;
      case "hedging":
        changes = {
          hedgingAmount: Number(hedgingAmount),
        };
        break;
      case "exchange-leverages":
        changes = {
          exchangeLeverages: getObjectDiff(
            groupStore.exchangeLeverages as Record<string, any>,
            convertStringValuesToNumbers(formExchangeLeverages)
          ),
        };
        break;
      case "positions":
        changes = {
          tokenLiquidityDistance: getObjectDiff(
            groupStore.tokenLiquidityDistance as Record<string, any>,
            tokenLiquidityDistance as Record<string, any>
          ),
        };
        break;
    }

    setPendingSubmit({ type: botType, changes });
    setOpenDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingSubmit || !token) return;

    setIsLoading(true);

    try {
      await api.put(`/api/v1/groups/me`, {
        ...pendingSubmit.changes,
        type: pendingSubmit.type,
        token: token,
      });

      enqueueSnackbar(`Updated successfully`, { variant: "success" });
      await dispatch(fetchGroup());

      setOpenDialog(false);
      setPendingSubmit(null);
      setToken("");
    } catch (error) {
      if (error instanceof AxiosError) {
        enqueueSnackbar(
          error.response?.data?.message || "Failed to save settings",
          { variant: "error" }
        );
      } else {
        enqueueSnackbar("An unexpected error occurred", { variant: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeExchangeLeverages = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;

    setFormExchangeLeverages((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [tabSelected, setTabSelected] = useState(0);

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
    setTabSelected(newValue);
  };

  const handleChangeTokenLiquidity = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    let newFormData;

    if (name.includes(".")) {
      const [tokenKey, side] = name.split(".");
      const validValue =
        Number(value) > 90 ? 90 : Number(value) < 0 ? 0 : Number(value);

      newFormData = {
        ...tokenLiquidityDistance,
        [tokenKey]: {
          ...(tokenLiquidityDistance as any)[tokenKey],
          [side]: validValue,
        },
      };
      console.log(newFormData);
      settokenLiquidityDistance(newFormData);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bot settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your positions are checked every 3 seconds.
        </Typography>
        <Typography fontStyle="italic" color="textSecondary">
          (Very important, need to understand clearly before choosing to run
          this bot, please do your own research)
        </Typography>
      </Box>
      <Card
        sx={{
          background: "rgb(30, 32, 38)",
        }}
      >
        <CardContent>
          <Typography sx={{ fontWeight: "bold" }} gutterBottom>
            1. Force-closing Bot
          </Typography>
          <Typography color={yellow} gutterBottom>
            If the position's volume on two exchanges deviates by more than the
            "volumeThreshold", both positions will be force-closed.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                color="success"
                checked={isBotForceClosingEnabled}
                onChange={(e) => {
                  setIsBotForceClosingEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setVolumeThreshold("0");
                  } else {
                    setVolumeThreshold(
                      groupStore.volumeThreshold?.toString() || ""
                    );
                  }
                }}
              />
            }
            label="Enable bot"
          />
          <Box
            sx={{ mt: 2 }}
            display="flex"
            alignItems="center"
            gap={2}
            justifyContent="flex-start"
          >
            <TextField
              size="small"
              sx={{ width: "350px" }}
              name="volumeThreshold"
              value={volumeThreshold}
              disabled={!isBotForceClosingEnabled}
              onChange={(e) => setVolumeThreshold(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">USDT</InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="outlined"
              startIcon={<SaveIcon />}
              disabled={isLoading}
              onClick={() => handleSubmit("force-close")}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box height={8} />

      <Card
        sx={{
          background: "rgb(30, 32, 38)",
        }}
      >
        <CardContent>
          <Typography sx={{ fontWeight: "bold" }} gutterBottom>
            2. Hedging Bot
          </Typography>
          <Typography color={yellow} gutterBottom>
            If the cross margin leverage limit{" "}
            <Typography component="span" sx={{ fontStyle: "italic" }}>
              (section 3)
            </Typography>{" "}
            set by the exchange is exceeded, this USDT amount will be
            transferred to hedge the position.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                color="success"
                checked={isBotHedgingEnabled}
                onChange={(e) => {
                  setIsBotHedgingEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setHedgingAmount("0");
                  } else {
                    setHedgingAmount(
                      groupStore.hedgingAmount.toString() || "0"
                    );
                  }
                }}
              />
            }
            label="Enable bot"
          />
          <Box
            sx={{ mt: 2 }}
            display="flex"
            alignItems="center"
            gap={2}
            justifyContent="flex-start"
          >
            <TextField
              size="small"
              sx={{ width: "350px" }}
              name="hedgingAmount"
              value={hedgingAmount}
              disabled={!isBotHedgingEnabled}
              onChange={(e) => setHedgingAmount(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">USDT</InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="outlined"
              startIcon={<SaveIcon />}
              disabled={isLoading}
              onClick={() => handleSubmit("hedging")}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box height={8} />

      <Card
        sx={{
          background: "rgb(30, 32, 38)",
        }}
      >
        <CardContent>
          <Typography sx={{ fontWeight: "bold" }} gutterBottom>
            3. Trigger hedging
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabSelected}
              onChange={handleChangeTab}
              aria-label="basic tabs example"
            >
              <Tab label="Exchanges" {...a11yProps(0)} />
              <Tab label="Positons" {...a11yProps(1)} />
            </Tabs>
          </Box>
          <CustomTabPanel value={tabSelected} index={0}>
            <CardContent>
              <Typography color={yellow} gutterBottom>
                If the cross margin level of the positions exceeds the permitted
                limit, the bot will search for the exchange with the highest
                available margin and transfer the amount configured in section 2
                (Hedging amount) to reduce the leverage.
              </Typography>
              <Table>
                <TableHead
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <TableRow sx={{ height: "48px" }}>
                    <TableCell align="left">
                      <Typography color="textSecondary">Exchange</Typography>
                    </TableCell>

                    <TableCell align="left">
                      <Typography color="textSecondary">
                        Current leverage
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="textSecondary">
                        Trigger leverage
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {error ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Alert severity="error">
                          <AlertTitle>Fetching balances error</AlertTitle>
                          {error}
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.keys(balances).map((exchangeName) => {
                      const vol = positions[
                        exchangeName as unknown as keyof typeof balances
                      ]?.reduce((tot, { markPrice, size }) => {
                        return (tot = tot + markPrice * size);
                      }, 0);
                      const isShown =
                        positions[
                          exchangeName as unknown as keyof typeof balances
                        ]?.length > 0;

                      const exchange: IFuture =
                        balances[
                          exchangeName as unknown as keyof typeof balances
                        ].future;

                      if (!isShown) {
                        return null;
                      }
                      return (
                        <Fragment key={exchangeName}>
                          <TableRow key={exchangeName}>
                            <TableCell>
                              <Box display="flex" justifyItems="center" gap={2}>
                                <img
                                  style={{
                                    borderRadius: "50%",
                                  }}
                                  src={`/${exchangeName}.png`}
                                  alt="USDT"
                                  width={20}
                                  height={20}
                                />
                                <Typography textTransform="capitalize">
                                  {exchangeName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography>
                                x
                                {numeral(vol / exchange.marginBalance).format(
                                  "0.0"
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                sx={{ width: "200px" }}
                                type="number"
                                size="small"
                                name={exchangeName.toLowerCase()}
                                value={
                                  formExchangeLeverages[
                                    exchangeName.toLowerCase()
                                  ]
                                }
                                onChange={handleChangeExchangeLeverages}
                                autoComplete="off"
                              />
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <Box
                sx={{ mt: 2 }}
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
              >
                <Button
                  type="submit"
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  disabled={isLoading}
                  onClick={() => handleSubmit("exchange-leverages")}
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </Box>
            </CardContent>
          </CustomTabPanel>
          <CustomTabPanel value={tabSelected} index={1}>
            <CardContent>
              <Typography color={yellow} gutterBottom>
                If the "distance to liquidation" exceeds the permitted limit,
                the bot will search for the exchange with the highest available
                margin and transfer the amount configured in section 2 (Hedging
                amount) to reduce the leverage.
              </Typography>
              <Table>
                <TableHead
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <TableRow sx={{ height: "48px" }}>
                    <TableCell align="left" width="40%">
                      <Typography color="textSecondary">Token</Typography>
                    </TableCell>

                    <TableCell align="left">
                      <Box display="flex" gap={1} justifyContent="flex-start">
                        <Typography color="textSecondary">Buy</Typography>
                        <ArrowDownwardIcon sx={{ fill: red }} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Typography color="textSecondary">Sell</Typography>
                        <ArrowUpwardIcon sx={{ fill: green }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positionsByBaseToken.map(({ baseToken }) => {
                    const { tokenLeverageWarning } = groupStore;
                    const tokenKey = baseToken.toLowerCase();
                    const buyValue =
                      (tokenLiquidityDistance as any)?.[tokenKey]?.buy ===
                      undefined
                        ? tokenLeverageWarning
                        : (tokenLiquidityDistance as any)?.[tokenKey]?.buy;
                    const sellValue =
                      (tokenLiquidityDistance as any)?.[tokenKey]?.sell ===
                      undefined
                        ? tokenLeverageWarning
                        : (tokenLiquidityDistance as any)?.[tokenKey]?.sell;

                    return (
                      <Fragment key={baseToken}>
                        <TableRow>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <img
                                src={`https://assets.coincap.io/assets/icons/${tokenKey}@2x.png`}
                                alt={baseToken}
                                width={20}
                                height={20}
                              />
                              <Typography>{baseToken}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box
                              display="flex"
                              gap={1}
                              justifyContent="flex-start"
                              alignItems="center"
                            >
                              <RemoveIcon sx={{ opacity: 0.5 }} />
                              <TextField
                                sx={{ width: "200px" }}
                                type="number"
                                size="small"
                                name={`${tokenKey}.buy`}
                                value={buyValue}
                                onChange={handleChangeTokenLiquidity}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      %
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              display="flex"
                              gap={1}
                              justifyContent="flex-end"
                              alignItems="center"
                            >
                              <AddIcon sx={{ opacity: 0.5 }} />
                              <TextField
                                sx={{ width: "200px" }}
                                type="number"
                                size="small"
                                name={`${tokenKey}.sell`}
                                value={sellValue}
                                onChange={handleChangeTokenLiquidity}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      %
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              <Box
                sx={{ mt: 2 }}
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
              >
                <Button
                  type="submit"
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  disabled={isLoading}
                  onClick={() => handleSubmit("positions")}
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </Box>
            </CardContent>
          </CustomTabPanel>
        </CardContent>
      </Card>

      <Dialog
        sx={{
          "& .MuiDialog-paper": { width: "650px" },
        }}
        keepMounted={false}
        maxWidth="xl"
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle sx={{ fontSize: 16, background: "#1e2026" }}>
          Confirm Changes
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ padding: "16px 12px", background: "#1e2026" }}
        >
          <Box display="flex" flexDirection="column" gap={2} my={2}>
            <Typography variant="subtitle1">
              Review the following changes:
            </Typography>
            <Alert
              severity="warning"
              sx={{ "& .MuiAlert-message": { width: "100%" } }}
            >
              <AlertTitle>Important Note</AlertTitle>
              These changes will take effect after approximately 3 minutes.
            </Alert>
            {pendingSubmit && (
              <Box
                sx={{
                  background: "rgba(0,0,0,0.03)",
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                {pendingSubmit.type === "force-close" && (
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography color="textSecondary">
                      Volume Threshold:
                    </Typography>
                    <Typography>
                      {pendingSubmit.changes.volumeThreshold} USDT
                    </Typography>
                  </Box>
                )}
                {pendingSubmit.type === "hedging" && (
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography color="textSecondary">
                      Hedging Amount:
                    </Typography>
                    <Typography>
                      {pendingSubmit.changes.hedgingAmount} USDT
                    </Typography>
                  </Box>
                )}

                {pendingSubmit.type === "exchange-leverages" && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography color="textSecondary" gutterBottom>
                      Exchange Leverages:
                    </Typography>
                    {Object.entries(pendingSubmit.changes.exchangeLeverages)
                      .length ? (
                      Object.entries(
                        pendingSubmit.changes.exchangeLeverages
                      ).map(([exchange, value]) => (
                        <Box
                          key={exchange}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography sx={{ textTransform: "capitalize" }}>
                            {exchange}:
                          </Typography>
                          <Typography>x{value as number}</Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>No Exchange Leverages Set</Typography>
                    )}
                  </Box>
                )}
                {pendingSubmit.type === "positions" && (
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography color="textSecondary" gutterBottom>
                      Distance to Liquidation:
                    </Typography>
                    {Object.entries(
                      pendingSubmit.changes.tokenLiquidityDistance
                    ).length ? (
                      Object.entries(
                        pendingSubmit.changes.tokenLiquidityDistance
                      ).map(([token, values]: [string, any]) => (
                        <Box
                          key={token}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Typography sx={{ textTransform: "uppercase" }}>
                            {token}
                          </Typography>
                          <Typography>
                            {values.buy !== undefined &&
                              `Buy [-${values.buy}%]`}
                            {values.buy !== undefined &&
                              values.sell !== undefined &&
                              " or "}
                            {values.sell !== undefined &&
                              `Sell [+${values.sell}%]`}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography>No Token Liquidity Distance Set</Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
            <TextField
              label="2FA Token"
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              fullWidth
              autoComplete="off"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ width: "100%", background: "#1e2026" }}>
          <Button color="inherit" onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="outlined"
            disabled={
              isLoading || token.length < 6 || !checkValidChanges(pendingSubmit)
            }
          >
            {isLoading ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BotSettings;

function checkValidChanges(
  pendingSubmit: { type: BotType; changes: Record<string, any> } | null
) {
  if (!pendingSubmit) return true;

  const { type, changes } = pendingSubmit;

  switch (type) {
    case "exchange-leverages":
      return !isEmpty(changes.exchangeLeverages);
    case "positions":
      return !isEmpty(changes.tokenLiquidityDistance);
    default:
      return true;
  }
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const TableCell = styled(TableCellMui)(() => ({
  padding: "12px 16px",
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}
