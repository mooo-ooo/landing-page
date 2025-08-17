import { useMemo } from "react";
import type { FC } from 'react';
import { Typography, Box } from '@mui/material';
import numeral from 'numeral';
import { PieChart } from "@mui/x-charts/PieChart";
import { useSelector } from "react-redux";
import { selectBalances } from "../redux/balances/balancesSlice";

interface EquitiesChartProps {
  width?: number
  height?: number
}

const EquitiesChart: FC<EquitiesChartProps> = ({
  width = 250,
  height = 250
}) => {
  const balances = useSelector(selectBalances);
  const totalMargin = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );

  const equities = useMemo(() => {
      const exchangeColors = {
        coinex: "rgb(14, 173, 152)",
        bitget: "rgb(3, 170, 199)",
        gate: "rgb(35, 84, 230)",
        huobi: "rgb(0, 148, 255)",
        bybit: "rgb(255, 177, 26)",
      };
      return Object.keys(balances).map((key) => {
        return {
          id: key,
          value:
            (balances[key as keyof typeof balances].total / totalMargin) * 100,
          label: `${key}`,
          color: exchangeColors[key as keyof typeof exchangeColors],
        };
      });
    }, [balances, totalMargin]);

  return (
    <Box>
      <Typography>
        Index Fund: ~{numeral(totalMargin).format("0,0.0")} USDT
      </Typography>
      <PieChart
        series={[
          {
            data: equities,
            innerRadius: 30,
            outerRadius: 100,
            paddingAngle: 1,
            cornerRadius: 3,
            startAngle: -45,
            arcLabel: (item) => `${numeral(item.value).format("0,0")}%`,
            arcLabelMinAngle: 35,
            arcLabelRadius: "60%",
          },
        ]}
        width={width}
        height={height}
      />
    </Box>
  );
};

export default EquitiesChart;
