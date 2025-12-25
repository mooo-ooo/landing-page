import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell as TableCellMui,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Alert,
  IconButton,
  AlertTitle,
} from "@mui/material";
import fetchVol24h from "../../../services/vol24h";
import CloseIcon from "@mui/icons-material/Close";
import Highcharts from "highcharts";
import readableNumber from "human-readable-numbers";
import HighchartsReact from "highcharts-react-official";
import dayjs from "dayjs";
import { styled } from "@mui/system";
import { green, red } from "../../../constants/colors";
import {
  type FundingHistoryResult,
  type WorkerInput,
  type WorkerOutput,
} from "../../../workers/funding.worker";
import MyArbitrageWorker from "../../../workers/funding.worker.ts?worker";
import { type ExchangeName } from "../../../types/exchange";
import { SIGNAL_WEEKS } from "../../../constants";

export interface IStatistic {
  label: string;
  accumulated: number;
  apr: number;
  sellEx: ExchangeName;
  buyEx: ExchangeName;
}

const PerformanceHistoryContainer: React.FC<{
  baseToken: string;
  exchanges: ExchangeName[];
  setStatistic: (data: IStatistic[]) => void;
}> = ({ baseToken, setStatistic, exchanges }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vol24h, setVol24h] = useState<Record<string, number>>({});
  const [weeks] = useState(
    () => Number(localStorage.getItem(SIGNAL_WEEKS)) || 2
  );

  const [fundingHistory, setFundingHisotry] = useState<FundingHistoryResult[]>(
    []
  );
  // --- Worker Effect ---
  useEffect(() => {
    setLoading(true);
    const worker = new MyArbitrageWorker();
    worker.postMessage({
      type: "FUNDING_HISTORY",
      token: baseToken, // truncated for brevity
      exchanges: exchanges,
      weeks,
    } as WorkerInput);

    worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
      if (e.data.status === "success")
        setFundingHisotry(e.data.data as FundingHistoryResult[]);
      else setError(e.data.errorMessage || "Failed to fetch data");
      setLoading(false);
      worker.terminate();
    };

    return () => worker.terminate();
  }, [weeks, baseToken, exchanges]);

  const allExchanges = useMemo(
    () => Array.from(new Set(fundingHistory.map((h) => h.exchange))),
    [fundingHistory]
  );

  // Fetch 24h Volume for all active exchanges
  useEffect(() => {
    const fetchVolumes = async () => {
      const volumeMap: Record<string, number> = {};

      // Using Promise.all to fetch volumes in parallel
      await Promise.all(
        allExchanges.map(async (ex) => {
          try {
            // Replace this with your actual API/Service call
            // Example: const ticker = await exchangeService.getTicker(ex, baseToken);
            // volumeMap[ex] = ticker.quoteVolume;
            const vol = await fetchVol24h(ex, baseToken);
            // For now, using a placeholder logic:
            volumeMap[ex] = vol;
          } catch (err) {
            console.error(`Failed to fetch volume for ${ex}`, err);
          }
        })
      );
      setVol24h(volumeMap);
    };

    if (allExchanges.length > 0) {
      fetchVolumes();
    }
  }, [allExchanges, baseToken]);

  // Transform data for the Table: Group by Timestamp
  const tableData = useMemo(() => {
    const timeMap: Record<string, Record<string, number>> = {};

    fundingHistory.forEach((exchData) => {
      exchData.history.forEach((point) => {
        const timeKey = dayjs(point.fundingTime).format("MM-DD HH:mm");
        if (!timeMap[timeKey]) timeMap[timeKey] = {};
        timeMap[timeKey][exchData.exchange] = point.fundingRate;
      });
    });

    return Object.keys(timeMap)
      .sort((a, b) =>
        dayjs(b, "MM-DD HH:mm").isAfter(dayjs(a, "MM-DD HH:mm")) ? 1 : -1
      )
      .map((time) => ({ time, rates: timeMap[time] }));
  }, [fundingHistory]);

  // Chart Configuration (Visualizing the difference between Sell and Buy exchange)
  const chartOptions = useMemo(() => {
    if (fundingHistory.length < 2) return {};

    // 1. Identify the Greatest and Smallest exchanges based on accumulated funding
    const sortedStats = [...fundingHistory].sort(
      (a, b) => b.accumulatedFunding - a.accumulatedFunding
    );
    const greatestEx = sortedStats[0];
    const smallestEx = sortedStats[sortedStats.length - 1];

    const categories: string[] = [];
    const seriesData: { y: number; color: string }[] = [];

    // 2. Align timestamps and calculate the spread (Greatest - Smallest)
    // We iterate through the 'greatest' exchange history as the primary timeline
    greatestEx.history.forEach((s) => {
      const match = smallestEx.history.find((b) =>
        dayjs(b.fundingTime).isSame(s.fundingTime)
      );

      if (match) {
        const spread = s.fundingRate - match.fundingRate;
        categories.push(dayjs(s.fundingTime).format("HH:mm"));

        seriesData.push({
          y: spread,
          // Optional: Color bars differently if spread is negative
          color: spread >= 0 ? green : red,
        });
      }
    });

    // Reverse categories and data to show chronological order (Left to Right)
    categories.reverse();
    seriesData.reverse();

    return {
      chart: {
        type: "column",
        backgroundColor: "transparent",
        height: 350,
        style: { fontFamily: "monospace" },
      },
      title: {
        text: `${greatestEx.exchange} vs ${smallestEx.exchange} (${weeks}W)`,
        style: { color: "#fff", fontSize: "14px" },
        align: "left",
      },
      xAxis: {
        categories,
        crosshair: false,
        tickInterval: 2,
        labels: { style: { color: "#888" }, rotation: 0 },
        gridLineWidth: 0,
        lineColor: "#333",
      },
      yAxis: {
        title: { text: "" },
        gridLineColor: "#222",
        labels: { style: { color: "#888" } },
        plotLines: [{ value: 0, color: "#444", width: 1 }],
      },
      series: [
        {
          name: "Spread",
          data: seriesData,
          borderRadius: 2,
          borderWidth: 0,
        },
      ],
      plotOptions: {
        column: {
          pointPadding: 0.1,
          groupPadding: 0.1,
          pointWidth: 5,
        },
      },
      legend: { enabled: false },
      credits: { enabled: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        style: { color: "#fff" },
        formatter: function (this: { y: number; category: string }) {
          return `<b>${this.category}</b><br/>Spread: ${this.y.toFixed(2)}%`;
        },
      },
    };
  }, [fundingHistory, weeks]);

  const summaryData = useMemo(() => {
    if (fundingHistory.length === 0) return [];

    const periods = [
      { label: "7 Days", weeks: 1 },
      { label: "2 Weeks", weeks: 2 },
    ];

    return periods.map((p) => {
      const cutoff = dayjs().subtract(p.weeks, "week");

      // Calculate stats per exchange for this specific period
      const stats = fundingHistory.map((exch) => {
        const historyInRange = exch.history.filter((h) =>
          dayjs(h.fundingTime).isAfter(cutoff)
        );
        const accumulated = historyInRange.reduce(
          (sum, h) => sum + h.fundingRate,
          0
        );
        return { exchange: exch.exchange, accumulated };
      });

      // Find extremes
      const sorted = [...stats].sort((a, b) => b.accumulated - a.accumulated);
      const bestSell = sorted[0];
      const bestBuy = sorted[sorted.length - 1];
      const diff = bestSell.accumulated - bestBuy.accumulated;
      const apr = (diff / 2 / (p.weeks * 7)) * 365;

      return {
        label: p.label,
        accumulated: diff,
        apr: apr,
        sellEx: bestSell.exchange,
        buyEx: bestBuy.exchange,
      };
    });
  }, [fundingHistory]);

  useEffect(() => {
    setStatistic(summaryData);
  }, [summaryData, setStatistic]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      {error ? (
        <Alert
          severity="error"
          variant="filled"
          action={
            <IconButton aria-label="close" color="inherit" size="small">
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            width: "100%",
            boxShadow: (theme) => theme.shadows[6],
            borderRadius: 2,
          }}
        >
          <AlertTitle sx={{ fontWeight: 800 }}>Data Fetching Error</AlertTitle>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      ) : null}
      {/* 2. Chart Section */}
      <Box
        borderRadius={1}
        sx={{
          border: "1px solid rgba(255, 255, 255, 0.12)",
          py: 2,
          px: 0,
          my: 2,
        }}
      >
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </Box>

      {/* 3. Detailed Table Section */}
      <Table
        size="small"
        sx={{ border: "1px solid rgba(255, 255, 255, 0.12)" }}
      >
        <TableHead>
          <TableRow>
            <TableCell>
              {" "}
              <Typography color="text.secondary">Time</Typography>
            </TableCell>
            {allExchanges.map((ex) => (
              <TableCell key={ex} align="right">
                <Typography color="text.secondary">
                  {ex.toUpperCase()}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow sx={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}>
            <TableCell>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: "bold" }}
              >
                VOL 24H
              </Typography>
            </TableCell>
            {allExchanges.map((ex) => (
              <TableCell key={`${ex}-vol`} align="right">
                <Typography
                  variant="body1"
                  color="info"
                  sx={{ fontFamily: "monospace", fontWeight: 'bold' }}
                >
                  {readableNumber.toHumanString(vol24h[ex])}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
          {tableData.map((row) => (
            <TableRow key={row.time} hover>
              <TableCell sx={{ color: "gray" }}>{row.time}</TableCell>
              {allExchanges.map((ex) => {
                const val = row.rates[ex];
                return (
                  <TableCell key={ex} align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color: val > 0 ? green : val < 0 ? red : "inherit",
                      }}
                    >
                      {val !== undefined ? `${val.toFixed(3)}%` : "—"}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const TableCell = styled(TableCellMui)({ padding: "8px 16px" });

export default PerformanceHistoryContainer;
