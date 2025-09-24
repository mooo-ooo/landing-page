import { useMemo } from "react";
import type { FC } from "react";
import { Typography, Box } from "@mui/material";
import numeral from "numeral";
import { PieChart } from "@mui/x-charts/PieChart";
import { useSelector } from "react-redux";
import { selectPositions } from "../redux/positions/positionsSlice";

interface VolumeChartProps {
  width?: number;
  height?: number;
}

const VolumeChart: FC<VolumeChartProps> = ({ width = 250, height = 250 }) => {
  const positions = useSelector(selectPositions);

  const volumes = useMemo(() => {
    const exchangeColors = {
      coinex: "rgb(14, 173, 152)",
      bitget: "rgb(3, 170, 199)",
      gate: "rgb(35, 84, 230)",
      huobi: "rgb(0, 148, 255)",
      bybit: "rgb(255, 177, 26)",
    };
    return Object.keys(positions).map((key) => {
      const positionExchange = positions[key as keyof typeof positions];
      return {
        id: key,
        value: positionExchange.reduce((tot, { size, markPrice }) => {
          return tot + size * markPrice;
        }, 0),
        label: `${key}`,
        color: exchangeColors[key as keyof typeof exchangeColors],
      };
    });
  }, [positions]);

  const totalVol = Object.values(volumes).reduce((tot, { value }) => {
    return tot + value;
  }, 0);

  return (
    <Box>
      <Box display='flex' alignItems='center'>
        <Typography mr={1}>Total volume:</Typography>
        <img height={16} src="/usdt.png" />
        <Typography ml={0.5}>{numeral(totalVol).format("0,0")}</Typography>
      </Box>

      <PieChart
        series={[
          {
            valueFormatter: (item) => `${numeral(item.value).format("0,0")} USDT`,
            data: volumes,
            innerRadius: 30,
            outerRadius: 100,
            paddingAngle: 1,
            cornerRadius: 3,
            startAngle: -45,
            arcLabel: (item) => `${numeral(item.value / totalVol * 100).format("0,0")}%`,
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

export default VolumeChart;
