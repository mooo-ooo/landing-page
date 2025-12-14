import type { FC } from "react";
import { Typography, Box, Skeleton } from "@mui/material";
import numeral from "numeral";
import { useSelector } from "react-redux";
import { selectBalances } from "../redux/balances/balancesSlice";
import { selectFundingLast7days } from "../redux/fundingFees/fundingFeesSlice";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";

interface FundingFeesChartProps {
  width?: number;
  height?: number;
  estimatedFundingFee: number;
  loadingFundingRates?: boolean;
}

const FundingFeesChart: FC<FundingFeesChartProps> = ({
  estimatedFundingFee,
  height,
  width,
  loadingFundingRates
}) => {
  const balances = useSelector(selectBalances);
  const rewardHistory = useSelector(selectFundingLast7days);
  const totalMargin = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );

  const apr = (estimatedFundingFee / totalMargin) * 3 * 365;
  const apy = convertAprToApy(apr, 12);
  return (
    <Box>
      {!rewardHistory?.length ? (
        <Skeleton animation="wave" />
      ) : (
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Typography mr={1}>Est.funding:</Typography>
            <Box mr={0.5} display='flex' alignItems='center'><img height={16} src="/usdt.png" /></Box>
            {loadingFundingRates ? (
              <Skeleton animation="wave" width={50} />
            ) : (
              <Typography>
                {numeral(estimatedFundingFee).format("0,0")}
              </Typography>
            )}
          </Box>
          <Typography>APY: {numeral(apy * 100).format("0,0")}%</Typography>
        </Box>
      )}
      {rewardHistory?.length ? (
        <ChartContainer
          xAxis={[
            {
              scaleType: "band",
              data: rewardHistory.map(({ date }) => date),
            },
          ]}
          series={[
            {
              type: "line",
              curve: "step",
              data: getAccumulatedArray(
                rewardHistory.map(({ value }) => value)
              ),
              color: "rgb(14, 203, 129)",
            },
            {
              data: rewardHistory.map(({ value }) => value),
              type: "bar",
              color: "rgb(14, 203, 129)",
            },
          ]}
          height={height}
          width={width}
          margin={{ bottom: 10 }}
        >
          <BarPlot />
          <ChartsAxisHighlight x="band" />
          <LinePlot />
          <MarkPlot />
          <ChartsXAxis />
          <ChartsYAxis />
          <ChartsTooltip />
        </ChartContainer>
      ) : (
        "loading ..."
      )}
    </Box>
  );
};

export default FundingFeesChart;

const getAccumulatedArray = (arr: number[]): number[] => {
  // A variable to store the running total.
  let runningSum = 0;

  // We use the `map` method to create a new array.
  // The `map` callback function takes each number in the original array
  // and updates the running sum.
  return arr.map((num) => {
    runningSum += num;
    return runningSum;
  });
};

export function convertAprToApy(
  apr: number,
  compoundingPeriods: number
): number {
  if (compoundingPeriods <= 0) {
    throw new Error("compoundingPeriods must be greater than 0");
  }
  return Math.pow(1 + apr / compoundingPeriods, compoundingPeriods) - 1;
}
