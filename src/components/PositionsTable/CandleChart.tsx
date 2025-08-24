import { useState, useEffect } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts/ChartsTooltip";
import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import numeral from "numeral";
import dayjs from "dayjs";
import { getCandleStick, type CandleStick } from "../../services/candlestick";
import type { ExchangeName } from "../../types/exchange";

function CandleChart({
  baseToken,
  sellExchanges,
  buyExchanges,
}: {
  sellExchanges: ExchangeName[];
  buyExchanges: ExchangeName[];
  baseToken: string;
}) {
  console.log({
    baseToken,
    sellExchanges,
    buyExchanges,
  });
  const [candleSticks, setCandleSticks] = useState<CandleStick[]>([]);

  useEffect(() => {
    getCandleStick(sellExchanges[0], baseToken).then(setCandleSticks);
  }, []);
  
  console.log({ candleSticks });
  return (
    <Box display="flex" flexDirection="column" gap="16px">
      {candleSticks.length ? (
        <Box>
          {/* <Box display='flex' alignItems='center' gap={1}>
            <img height={30} src={`https://assets.coincap.io/assets/icons/${baseToken.toLowerCase()}@2x.png`} />
            <Typography fontWeight='bold'>{baseToken}</Typography>
          </Box> */}
          <ChartContainer
            xAxis={[
              {
                scaleType: "time",
                valueFormatter: (time) => dayjs(time).format("HH:mm"),
                data: candleSticks.map(({ time }) => time),
              },
            ]}
            series={[
              {
                showMark: false,
                type: "line",
                // curve: "linear",
                data: candleSticks.map(({ price }) => price),
                color: "rgb(240, 185, 11)",
              },
              // {
              //   data: rewardHistory.map(({ value }) => value),
              //   type: "bar",
              //   color: "rgb(14, 203, 129)",
              // },
            ]}
            height={300}
            // width={width}
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
        </Box>
      ) : null}
    </Box>
  );
}

export default CandleChart;
