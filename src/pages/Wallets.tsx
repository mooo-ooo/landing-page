import type { FC } from "react";
import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import dayjs from "dayjs";
import { styled } from "@mui/system";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  TableHead,
  Table,
  TableCell as TableCellMui,
  TableRow,
  TableBody,
  TableFooter,
  InputAdornment,
  Button,
  Alert,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  TablePagination,
  tablePaginationClasses as classes,
} from "@mui/base/TablePagination";
import PhonelinkLockIcon from "@mui/icons-material/PhonelinkLock";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { useSnackbar } from "notistack";
import numeral from "numeral";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import ExchangeMargin from "../components/ExchangeMargin";
import api from "../lib/axios";
import { genExplorerTxUrl, genExplorerAddUrl } from "../helpers";

const exchanges = ["coinex", "huobi", "okx", "bybit", "gate", "bitget"];

interface ITransaction {
  tx: string;
  createdAt: number;
  id: string;
  chain: string;
  amount: string;
  status: string;
  type: string;
  exchange: string;
  to: string;
  from: string;
}

interface IAddress {
  address: string;
  chain: string;
}

const Dashboard: FC = () => {
  const balances = useSelector((state: RootState) => state.balances);
  const [page, setPage] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [ggToken, setToken] = useState("");
  const [fromEx, setFromExchange] = useState("");
  const [transactionMap, setTransactionMap] = useState<Record<string, string>>(
    {}
  );
  const [toEx, setToExchange] = useState("");
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [isTransferPending, setisTransferPending] = useState<boolean>(false);
  const [exchangeAddresses, setExchangeAddresses] = useState<
    Record<string, IAddress[]>
  >({});

  const handleChangeFrom = (event: SelectChangeEvent) => {
    setFromExchange(event.target.value);
  };
  const handleChangeTo = (event: SelectChangeEvent) => {
    setToExchange(event.target.value);
  };

  const handleResolveTransferPending = async () => {
    setLoading(true);
    const { data } = await api.post("/wallet/transfer-pending", {
      status: false,
    });
    if (data) {
      setisTransferPending(data.isTransferPending);
      setLoading(false);
      enqueueSnackbar(`You now can do transfer again`, { variant: "success" });
    }
  };

  const fetchTransferPending = () => {
    // api.get("/wallet/transfer-pending").then(function ({ data }) {
    //   setisTransferPending(data.isTransferPending);
    // });
  };

  const fetchTransferMap = () => {
    api.get("/api/v1/wallets/transaction-map").then(function ({ data }) {
      setTransactionMap(data);
    });
  };

  const fetchDepositAddresses = () => {
    api.get("/api/v1/wallets/deposit-addresses").then(function ({ data }) {
      setExchangeAddresses(data);
    });
  };

  const fetchTransactions = () => {
    setLoading(true);
    api.get("/api/v1/wallets/transactions").then(({ data }) => {
      const results = Object.keys(data).reduce(
        (acum: ITransaction[], exchange: string) => {
          const trans = data[exchange] as ITransaction[];
          const transWithExchange = acum.concat(
            trans.map((tran) => {
              return {
                ...tran,
                exchange,
              };
            })
          );
          return transWithExchange.sort((a, b) => b.createdAt - a.createdAt);
        },
        []
      );

      setTransactions(results);
    });
  };

  useEffect(() => {
    fetchTransferPending();
    fetchTransactions();
    fetchTransferMap();
    fetchDepositAddresses();
  }, []);

  const handleTransfer = async () => {
    setLoading(true);
    const { data } = await api
      .post("/wallet/transfer", {
        from: fromEx.toLowerCase(),
        to: toEx.toLowerCase(),
        amount,
        ggToken,
      })
      .catch((err) => {
        enqueueSnackbar(err.response?.data?.error, { variant: "error" });
        return {
          data: undefined,
        };
      });
    if (data) {
      enqueueSnackbar(
        `Withdrew to \n${
          data?.depositAddress?.address || toEx.toLowerCase()
        }, \ncheck tele for new updates`,
        { variant: "success" }
      );
    }
    setAmount(0);
    setLoading(false);
    setToken("");
  };

  const { chainSelected, addressSelected } = useMemo(() => {
    if (!fromEx || !toEx || !transactionMap || !exchangeAddresses) {
      return {};
    }
    const chainSelected = transactionMap[`${fromEx}-${toEx}`];
    const foundAdd = exchangeAddresses[toEx]?.find(
      ({ chain }) => chain === chainSelected
    );
    console.log();
    return {
      chainSelected,
      addressSelected: foundAdd?.address,
    };
  }, [fromEx, toEx, transactionMap, exchangeAddresses]);
  console.log({ chainSelected });
  const validEx =
    exchanges.includes(fromEx) && exchanges.includes(toEx) && fromEx !== toEx;

  const selectedFromEx = fromEx
    ? balances[fromEx as unknown as keyof typeof balances]
    : null;
  const selectedToEx = toEx
    ? balances[toEx as unknown as keyof typeof balances]
    : null;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - transactions.length) : 0;

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

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Grid container spacing={6}>
        <Grid size={6}>
          <Box
            sx={{ border: "1px solid rgba(81, 81, 81, 1)" }}
            padding={2}
            alignItems="center"
          >
            <Box
              display="flex"
              gap={2}
              justifyContent="space-around"
              alignItems="center"
            >
              <FormControl fullWidth sx={{ mb: 2 }}>
                {selectedFromEx ? (
                  <Typography variant="caption">
                    Availale balance:&nbsp;
                    {numeral(
                      (
                        selectedFromEx as unknown as {
                          future: { marginAvailable: number };
                          trading: { marginAvailable: number };
                        }
                      )?.future?.marginAvailable ||
                        (
                          selectedFromEx as unknown as {
                            future: { marginAvailable: number };
                            trading: { marginAvailable: number };
                          }
                        )?.trading?.marginAvailable
                    ).format("0,0.0")}{" "}
                    USDT
                  </Typography>
                ) : (
                  <Typography variant="caption">From exchange</Typography>
                )}
                <Select value={fromEx} onChange={handleChangeFrom} displayEmpty>
                  {exchanges.map((ex) => (
                    <MenuItem disabled={ex === toEx} key={ex} value={ex}>
                      {ex}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DoubleArrowIcon />
              <FormControl fullWidth sx={{ mb: 2 }}>
                {selectedToEx ? (
                  <Typography variant="caption">
                    Availale balance: &nbsp;
                    {numeral(
                      (
                        selectedToEx as unknown as {
                          future: { marginAvailable: number };
                          trading: { marginAvailable: number };
                        }
                      )?.future?.marginAvailable ||
                        (
                          selectedToEx as unknown as {
                            future: { marginAvailable: number };
                            trading: { marginAvailable: number };
                          }
                        )?.trading?.marginAvailable
                    ).format("0,0.0")}{" "}
                    USDT
                  </Typography>
                ) : (
                  <Typography variant="caption">To exchange</Typography>
                )}
                <Select value={toEx} onChange={handleChangeTo} displayEmpty>
                  {exchanges.map((ex) => (
                    <MenuItem disabled={ex === fromEx} key={ex} value={ex}>
                      {ex}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box mt={2} display="flex" gap={6} justifyContent="space-around">
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="filled-number"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Number(event.target.value);
                    setAmount(val);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">USDT</InputAdornment>
                      ),
                    },
                  }}
                  label={`Amount`}
                  type="number"
                  value={amount || ""}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: "5",
                    min: String(30),
                  }}
                  variant="standard"
                />
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setToken(event.target.value);
                  }}
                  label={`2FA Code`}
                  type="string"
                  value={ggToken}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="standard"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhonelinkLockIcon
                            sx={{ fill: "rgba(255, 255, 255, 0.5)" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </FormControl>
            </Box>

            <Grid container spacing={1}>
              <Grid size={6}>
                {/* {addressSelected} */}
                {chainSelected && addressSelected ? (
                  <Alert severity="info">
                    <Box display="flex" flexDirection="column">
                      <Typography fontSize="14px">
                        Chain: {chainSelected}
                      </Typography>
                      <Box display="flex" flexDirection="row" alignItems="center">
                        <Typography fontSize="14px">
                          Address: {shortenAddress(addressSelected || "", 7, 7)}
                        </Typography>
                        <IconButton
                          onClick={() => {
                            navigator.clipboard.writeText(addressSelected);
                            enqueueSnackbar(`Copy ${addressSelected}`, {
                              variant: "success",
                            });
                          }}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Alert>
                ) : null}
              </Grid>
              <Grid size={6}>
                <Box display="flex" justifyContent="flex-end">
                  {isTransferPending ? (
                    <Button
                      onClick={handleResolveTransferPending}
                      disabled={!isTransferPending}
                      variant="contained"
                      endIcon={<SwapVertIcon />}
                    >
                      {isTransferPending ? "Resolve" : "All gud"}
                    </Button>
                  ) : null}
                  <LoadingButton
                    size="large"
                    // loading={loading}
                    onClick={handleTransfer}
                    variant="contained"
                    disabled={!ggToken || amount <= 0 || !validEx}
                  >
                    Transfer
                  </LoadingButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Grid size={6}>
          <ExchangeMargin />
        </Grid>
      </Grid>
      <Box>
        <Typography my={2} fontWeight="bold">
          Withdrawal/Deposit Records
        </Typography>
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
                backgroundColor: "#010409",
              }}
            >
              <TableRow sx={{ height: "48px" }}>
                <TableCell align="left">Datetime</TableCell>
                <TableCell align="left">Exchange</TableCell>
                <TableCell align="left">Chain</TableCell>
                <TableCell align="left">From</TableCell>
                <TableCell align="left">To</TableCell>
                <TableCell align="left">Amount</TableCell>
                <TableCell align="left">TxId</TableCell>

                <TableCell align="left">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? transactions.slice(
                    page * rowsPerPage,
                    page * rowsPerPage + rowsPerPage
                  )
                : transactions
              ).map(
                ({
                  createdAt,
                  from,
                  amount,
                  status,
                  tx,
                  to,
                  chain,
                  id,
                  exchange,
                }) => {
                  return (
                    <TableRow key={id}>
                      <TableCell>
                        <Typography>
                          {dayjs(new Date(Number(createdAt))).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography textTransform="capitalize">
                          {exchange}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography textTransform="capitalize">
                          {chain}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {from?.length > 10 ? (
                          <a href="tx" target="_blank">
                            {shortenAddress(from)}
                          </a>
                        ) : (
                          <Typography textTransform="capitalize">
                            {from || "Unknown"}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {to?.length > 10 ? (
                          <a
                            href={genExplorerAddUrl(to, chain)}
                            target="_blank"
                          >
                            {shortenAddress(to)}
                          </a>
                        ) : (
                          <Typography textTransform="capitalize">
                            {to}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <img
                            src={`https://assets.coincap.io/assets/icons/usdt@2x.png`}
                            width={20}
                            height={20}
                          />
                          <Typography>
                            {numeral(amount).format("0,0.0")}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <a href={genExplorerTxUrl(tx, chain)} target="_blank">
                          {shortenAddress(tx)}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            borderRadius: 8,
                            width: "fit-content",
                            padding: "4px 8px",
                            color: COLOR_MAP[
                              status as unknown as keyof typeof COLOR_MAP
                            ] as string,
                          }}
                        >
                          <Typography textTransform="capitalize" fontSize={12}>
                            {status.toLowerCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                }
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 41 * emptyRows }}>
                  <TableCell colSpan={5} aria-hidden />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <tr>
                <CustomTablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={5}
                  count={transactions.length}
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
      </Box>
    </Box>
  );
};

const COLOR_MAP = {
  finished: "rgb(14, 203, 129)",
  DONE: "rgb(14, 203, 129)",
  success: "rgb(14, 203, 129)",
  confirmed: "rgb(14, 203, 129)",
  PENDING: "rgb(240, 185, 11)",
  canceled: "rgb(246, 70, 93)",
};

export default Dashboard;

function shortenAddress(
  address: string,
  startChars: number = 5,
  endChars: number = 4
): string {
  // Check if the address is valid and long enough to be shortened
  if (!address || address.length <= startChars + endChars) {
    return address; // Return original if too short or invalid
  }

  // Extract the start and end parts of the address
  const start = address.slice(0, startChars);
  const end = address.slice(-endChars);

  // Combine them with an ellipsis in between
  return `${start}...${end}`;
}

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

const TableCell = styled(TableCellMui)(() => ({
  padding: "12px 16px",
}));
