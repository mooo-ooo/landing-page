import {
  Box,
  Button,
} from "@mui/material";
import type { ExchangeName } from "../../../types/exchange";
import Volume24h from '../Volume24h'
import VisibilityIcon from '@mui/icons-material/Visibility';
import CandleChart from '../CandleChart'
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../redux/store";
import type { IPosition } from "../../../redux/positions/positionsSlice";
import {
  setUpdateStrategy,
  setNewStrategy,
  type IStrategy,
} from "../../../redux/strategy/strategySlice";

export interface IDetails {
  foundStrategy?: IStrategy
  buys: IPosition[];
  sells: IPosition[];
  baseToken: string;
}

function TableDetailsWeb({ foundStrategy, baseToken, buys, sells }: IDetails) {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <Box>
      <Box display="flex" sx={{ margin: 1 }} justifyContent="space-between">
        <Volume24h
          buyExchange={buys[0]?.exchange}
          sellExchange={sells[0]?.exchange}
          baseToken={baseToken}
        />
        <Button onClick={() =>
            foundStrategy
              ? dispatch(
                  setUpdateStrategy({
                    open: true,
                    baseToken,
                  })
                )
              : dispatch(setNewStrategy({ open: true, baseToken }))
          } variant="outlined" endIcon={<VisibilityIcon />}>
          Strategy
        </Button>
      </Box>
      <Box sx={{ margin: 1}}>
        <CandleChart
          baseToken={baseToken}
          sellExchanges={sells.map((sell) => sell.exchange as ExchangeName)}
          buyExchanges={buys.map((buy) => buy.exchange as ExchangeName)}
        />
      </Box>
    </Box>
  );
}

export default TableDetailsWeb;
