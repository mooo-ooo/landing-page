import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, Skeleton, Tooltip } from "@mui/material";
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { getMarketDepth } from "../../services/marketDepth";
import { type ExchangeName } from "../../types/exchange";
import { green, red } from "../../constants/colors";

interface SpreadProps {
  symbol: string;
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
}

const Spread: React.FC<SpreadProps> = ({ symbol, buyExchange, sellExchange }) => {
  const [data, setData] = useState<{ open: number; close: number } | null>(null);
  const [syncGap, setSyncGap] = useState<number | null>(null); // Diff between exchange timestamps
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpreads = async () => {
      try {
        // Fetch depth for both exchanges in parallel
        const [depthBuy, depthSell] = await Promise.all([
          getMarketDepth(buyExchange, symbol),
          getMarketDepth(sellExchange, symbol),
        ]);

        // Best Ask = Lowest price someone is willing to sell (bids[0] is highest buy, asks[0] is lowest sell)
        const buyExAsk = depthBuy.asks[0][0];
        const buyExBid = depthBuy.bids[0][0];

        const sellExAsk = depthSell.asks[0][0];
        const sellExBid = depthSell.bids[0][0];

        // Calculation: (PriceDiff / ReferencePrice) * 100
        const openSpread = calculateSpread(sellExBid, buyExAsk);
        const closeSpread = calculateSpread(buyExBid, sellExAsk)

        // Calculate the absolute difference between the two exchange timestamps (ms)
        const diff = Math.abs(depthBuy.updated - depthSell.updated);
        setSyncGap(diff);

        setData({ open: openSpread, close: closeSpread });
        setLoading(false);
      } catch (err) {
        console.error("Spread fetch error:", err);
      }
    };

    fetchSpreads();
    const interval = setInterval(fetchSpreads, 5000);
    return () => clearInterval(interval);
  }, [symbol, buyExchange, sellExchange]);

  if (loading) return <Skeleton width={80} height={40} />;

  // Warning color logic: if the two prices are more than 2 seconds apart, it's risky
  const isSyncRisky = syncGap && syncGap > 2000;

  return (
    <Stack direction="row" spacing={2} >
      <Stack spacing={0.5}>
        <Tooltip title="Spread to Open: (BuyEx Ask - SellEx Bid)">
        <Box display="flex" gap={2}>
          <Typography variant="caption" color="text.secondary">Open:</Typography>
          <Typography variant="caption" fontWeight="bold" color={data!.open <= 0 ? red : green}>
            {data!.open.toFixed(3)}%
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip title="Spread to Close: (SellEx Ask - BuyEx Bid)">
        <Box display="flex" gap={2}>
          <Typography variant="caption" color="text.secondary">Close:</Typography>
          <Typography variant="caption" fontWeight="bold" color={data!.close <= 0 ? red : green}>
            {data!.close.toFixed(3)}%
          </Typography>
        </Box>
      </Tooltip>
      </Stack>
      
      {/* Latency (Timestamp Sync Gap) */}
      <Tooltip title="Difference in time between the two exchange price updates. Lower is better.">
        <Box display="flex" alignItems="center">
          <SyncAltIcon sx={{ fontSize: 12, color: isSyncRisky ? red : "text.disabled" }} />
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '10px', 
              color: isSyncRisky ? red : "text.disabled",
              fontWeight: isSyncRisky ? 700 : 400 
            }}
          >
            {syncGap}ms
          </Typography>
        </Box>
      </Tooltip>
    </Stack>
  );
};

export default Spread;

const calculateSpread = (highPrice: number, lowPrice: number) => {
  const gap = Number(highPrice) - Number(lowPrice);
  const gapPercentage = (gap / highPrice) * 100;
  return gapPercentage;
};