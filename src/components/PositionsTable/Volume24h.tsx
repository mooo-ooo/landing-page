import { useState, useEffect } from "react";
import { Box, Typography, Skeleton } from "@mui/material";
import get24hVolume from "../../services/vol24h";
import type { ExchangeName } from "../../types/exchange";
import numeral from "numeral";

function Volume24h({
  baseToken,
  sellExchange,
  buyExchange,
}: {
  sellExchange: string;
  buyExchange: string;
  baseToken: string;
}) {
  const [vol24h, setVol24h] = useState<{ buyVol: number; sellVol: number }>({
    buyVol: 0,
    sellVol: 0,
  });

  useEffect(() => {
    const fetchVol = async () => {
      const [buyVol, selVol] = await Promise.all([
        get24hVolume(buyExchange as ExchangeName, baseToken),
        get24hVolume(sellExchange as ExchangeName, baseToken),
      ]);
      setVol24h({
        buyVol: buyVol.usdt,
        sellVol: selVol.usdt,
      });
    };
    fetchVol();
  }, []);

  if (!vol24h.buyVol) {
    return <Skeleton animation="wave" height={64} />
  }
  return (
    <Box display="flex" gap="16px">
      <Typography>Volume 24h (USDT):</Typography>
      <Typography>
        {buyExchange.toUpperCase()}: {numeral(vol24h.buyVol).format("0,0]")}
      </Typography>
      <Typography>
        {sellExchange.toUpperCase()}: {numeral(vol24h.sellVol).format("0,0]")}
      </Typography>
    </Box>
  );
}

export default Volume24h;
