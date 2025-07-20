import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import type { RootState } from "../redux/store";
import numeral from "numeral";
import { useSelector } from "react-redux";
import { useBalances } from "../redux/selector";
import type { IFuture } from "../redux/balances/balancesSlice";

const WARNING_LEV = 6;
function ExchangeMargin() {
  const balances = useSelector((state: RootState) => state.balances);
  const positions = useSelector((state: RootState) => state.positions);
  const { leverage } = useBalances();

  return (
    <Box display="flex" flexDirection="column" gap="16px">
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
            <TableRow sx={{ height: "64px" }}>
              <TableCell align="left">
                Exchange (x{numeral(leverage).format("0,0.00")})
              </TableCell>

              <TableCell align="left">Equity</TableCell>
              <TableCell align="left">Available</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(balances).map((exchangeName) => {
              const vol = positions[
                exchangeName as unknown as keyof typeof balances
              ]?.reduce((tot, { markPrice, size }) => {
                return (tot = tot + markPrice * size);
              }, 0);

              const isShown =
                positions[exchangeName as unknown as keyof typeof balances]
                  ?.length > 0;

              const exchange: IFuture =
                balances[exchangeName as unknown as keyof typeof balances]
                  .future;

              const lev = vol / exchange.marginBalance;

              if (!isShown) {
                return null;
              }
              return (
                <TableRow>
                  <TableCell
                    sx={{
                      color: lev > WARNING_LEV ? "#FFC107" : "unset",
                    }}
                  >
                    {exchangeName} [x
                    {numeral(vol / exchange.marginBalance).format("0.0")}]
                  </TableCell>
                  <TableCell>
                    ${numeral(exchange.marginBalance).format("0,0")}
                  </TableCell>
                  <TableCell>
                    ${numeral(exchange.marginAvailable).format("0,0")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default ExchangeMargin;
