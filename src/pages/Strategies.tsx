import { type FC, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@mui/material";
import type { IStrategy } from "../redux/strategy/strategySlice";
import api from "../lib/axios";

const Strategies: FC = () => {
  const [strategies, setStrategies] = useState<IStrategy[]>([]);
  useEffect(() => {
    api.get("/api/v1/strategies").then(({ data }) => {
      setStrategies(data);
    });
  }, []);
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
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
              }) => {
                return (
                  <TableRow key={_id}>
                    <TableCell>{strategyName}</TableCell>
                    <TableCell>
                      {sellExchange} | {sellSymbol}
                    </TableCell>
                    <TableCell>
                      {buyExchange} | {buySymbol}
                    </TableCell>
                    <TableCell>
                      {bestInSpread} | {secondInSpread}
                    </TableCell>
                    <TableCell>
                      {bestOutSpread} | {secondOutSpread}
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
