import type { FC } from "react";
import { useEffect, useState } from "react";
import api from "../lib/axios";
import { Typography, Box, Skeleton } from "@mui/material";
import numeral from "numeral";
import { useSelector } from "react-redux";
import { selectBalances } from "../redux/balances/balancesSlice";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { BarPlot } from "@mui/x-charts/BarChart";
import Marquee from "react-fast-marquee";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";

interface FundingFeesChartProps {
  loadingFundingRates: boolean;
  period?: number;
  width?: number;
  height?: number;
  estimatedFundingFee: number;
}

const FundingFeesChart: FC<FundingFeesChartProps> = ({
  period = 7,
  estimatedFundingFee,
  height,
  width,
  loadingFundingRates,
}) => {
  const balances = useSelector(selectBalances);
  const totalMargin = Object.values(balances).reduce(
    (tot, { total = 0 }) => tot + total,
    0
  );
  const [rewardHistory, setRewardHistory] = useState<
    { date: string; value: number }[]
  >([]);
  useEffect(() => {
    api
      .get(`/api/v1/account/funding-fees/last-7-days?period=${period}`)
      .then((result: { data: { fundingByDay: Record<string, number> } }) => {
        if (
          result.data?.fundingByDay &&
          Object.keys(result.data.fundingByDay).length > 0
        ) {
          const fundingByDay = result.data.fundingByDay;

          const fullToShortMap: Record<string, string> = {
            Monday: "Mon",
            Tuesday: "Tue",
            Wednesday: "Wed",
            Thursday: "Thu",
            Friday: "Fri",
            Saturday: "Sat",
            Sunday: "Sun",
          };

          const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          // Get today's index in short form: 0 = Sun, 1 = Mon, ..., 6 = Sat
          const todayIndex = new Date().getDay();

          // Create circular day order ending with today
          const circularOrder = [
            ...shortDays.slice((todayIndex + 1) % 7),
            ...shortDays.slice(0, (todayIndex + 1) % 7),
          ];

          const mappedHistory = circularOrder.map((shortName) => {
            const fullName = Object.keys(fullToShortMap).find(
              (key) => fullToShortMap[key] === shortName
            )!;
            return {
              date: shortName,
              value: fundingByDay[fullName] || 0,
            };
          });
          setRewardHistory(mappedHistory);
        }
      })
      .catch((err) => {
        console.error(err);
        setRewardHistory([]);
      });
  }, []);

  const apr = (estimatedFundingFee / totalMargin) * 3 * 365;
  const apy = convertAprToApy(apr, 12);
  return (
    <Box>
      {loadingFundingRates ? (
        <Skeleton animation="wave" />
      ) : (
        <Box display="flex" justifyContent="space-between">
          <Typography>
            Estimated funding: ${numeral(estimatedFundingFee).format("0,0")}{" "}
            USDT
          </Typography>
          <Box width={120}>
            <Marquee speed={20} delay={100}>
              <Typography mr={6}>APR: {numeral(apr * 100).format("0,0")}%</Typography>
              <Typography mr={6}>APY: {numeral(apy * 100).format("0,0")}%</Typography>
            </Marquee>
          </Box>
        </Box>
      )}
      {rewardHistory.length ? (
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
