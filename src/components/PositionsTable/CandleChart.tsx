import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import dayjs from "dayjs";
import { getCandleSticks, type CandleStick } from "../../services/candlestick";
import { fundingRateHistory } from "../../services/fundingRateHistory";
import type { ExchangeName } from "../../types/exchange";
import numeral from "numeral";

function CandleChart({
  baseToken,
  sellExchanges,
  buyExchanges,
}: {
  sellExchanges: ExchangeName[];
  buyExchanges: ExchangeName[];
  baseToken: string;
}) {
  const [candleSticks, setCandleSticks] = useState<CandleStick[]>([]);
  const [diffFundings, setDiffFundings] = useState<number[]>([]);

  const calculateFundingRates = async () => {
    const [sellFundingRates, buyFundingRates] = await Promise.all([
      fundingRateHistory(sellExchanges[0], baseToken),
      fundingRateHistory(buyExchanges[0], baseToken),
    ]);
    const diffFundings = () => {
      // Create a Map for efficient lookups of sell funding rates
      const sellFundingRatesMap = new Map(
        sellFundingRates.map((rate) => [
          rate.fundingTime.toString(),
          rate.fundingRate,
        ])
      );

      // Create a Map for efficient lookups of buy funding rates
      const buyFundingRatesMap = new Map(
        buyFundingRates.map((rate) => [
          rate.fundingTime.toString(),
          rate.fundingRate,
        ])
      );

      return candleSticks.map(({ time }) => {
        // Standardize the time format for lookup keys
        const fundingTimeKey = dayjs(Number(time)).toDate().toString();

        // Get rates from the maps, defaulting to 0 if not found
        const sellFundingRate = sellFundingRatesMap.get(fundingTimeKey) || 0;
        const buyFundingRate = buyFundingRatesMap.get(fundingTimeKey) || 0;

        return sellFundingRate - buyFundingRate;
      });
    };

    setDiffFundings(diffFundings);
  };

  useEffect(() => {
    getCandleSticks(sellExchanges[0], baseToken).then(setCandleSticks);
  }, []);

  useEffect(() => {
    if (candleSticks.length) {
      calculateFundingRates();
    }
  }, [candleSticks]);

  const last2WeeksFundingRates = diffFundings.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0
  );

  const options = {
    title: {
      text: null,
    },
    chart: {
      polar: true,
      type: "line",
      backgroundColor: "none",
    },
    xAxis: {
      categories: candleSticks.map(({ time }) => dayjs(time).format("DD MMM")),
      crosshair: false,
      tickInterval: 24,
      lineColor: "rgb(81 81 81 / 50%)",
      labels: {
        style: {
          color: "#FFF",
        },
      },
    },
    plotOptions: {
      column: {
        pointWidth: 5,
        borderColor: "none", // Red border color
        borderWidth: 0, // 2px border width
        borderRadius: 2, // Sets a fixed width of 20 pixels for each column
      },
    },
    yAxis: [
      {
        // Primary yAxis
        gridLineWidth: 0,
        labels: {
          formatter: ({ value }: { value: number }) => {
            return numeral(value).format("0,0.0");
          },
          style: {
            color: "#FFF",
          },
        },
        title: {
          text: "Price",
        },
        lineColor: "rgb(81 81 81 / 50%)",
        lineWidth: 1,
        opposite: true,
      },
      {
        // Secondary yAxis
        // gridLineWidth: 0,
        gridLineColor: "rgb(81 81 81 / 10%)",
        title: {
          text: "Funding",
        },
        labels: {
          formatter: ({ value }: { value: number }) => {
            return numeral(value).format("0,0.[000]") + "%";
          },
          style: {
            color: "#FFF",
          },
        },
        lineWidth: 1,
        lineColor: "rgb(81 81 81 / 50%)",
      },
    ],
    tooltip: {
      split: true,
    },
    series: [
      {
        name: "Funding rates",
        type: "column",
        color: "rgb(14, 203, 129)",
        negativeColor: "rgb(246, 70, 93)",
        data: diffFundings,
        showInLegend: false,
        yAxis: 1,
      },
      {
        name: "Price",
        type: "line",
        yAxis: 0,
        data: candleSticks.map(({ price }) => price),
        showInLegend: false,
        color: "rgb(240, 185, 11)",
      },
    ],
  };
  return (
    <Box display="flex" flexDirection="column" gap="16px">
      {candleSticks.length && diffFundings.length ? (
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontWeight="bold" mb={2}>
              Last 2 weeks APR:{" "}
              {numeral((last2WeeksFundingRates * (365 / (7 * 2))) / 2).format(
                "0.000"
              )}
              %
            </Typography>
          </Box>
          <HighchartsReact highcharts={Highcharts} options={options} />
        </Box>
      ) : null}
    </Box>
  );
}

export default CandleChart;
