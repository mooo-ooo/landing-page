import { useState, useEffect } from "react";
import { toHumanString } from "../../services/humanReadable";
import useMediaQuery from '@mui/material/useMediaQuery'
import { Box, Typography, Skeleton } from "@mui/material";
import get24hVolume from "../../services/vol24h";
import type { ExchangeName } from "../../types/exchange";

function Volume24h({
  baseToken,
  sellExchange,
  buyExchange,
}: {
  sellExchange?: string;
  buyExchange?: string;
  baseToken: string;
}) {
  const isWeb = useMediaQuery('(min-width:600px)')
  const [vol24h, setVol24h] = useState<{ buyVol: number; sellVol: number }>({
    buyVol: 0,
    sellVol: 0,
  });

  useEffect(() => {
    const fetchVol = async () => {
      const [buyVol, selVol] = await Promise.all([
        buyExchange ? get24hVolume(buyExchange as ExchangeName, baseToken) : 0,
        sellExchange
          ? get24hVolume(sellExchange as ExchangeName, baseToken)
          : 0,
      ]);
      setVol24h({
        buyVol: buyVol,
        sellVol: selVol,
      });
    };
    fetchVol();
  }, []);

  if (!vol24h.buyVol) {
    return <Skeleton animation="wave" height={64} />;
  }
  return (
    <Box display="flex" width={isWeb ? 'unset' : "100%"} justifyContent="space-between">
      <Typography color="textSecondary" mr={1}>Volume 24h (USDT):</Typography>
      <Box display="flex" gap={1}>
        {buyExchange ? (
          <Box display="flex">
            <img
              style={{
                borderRadius: "50%",
              }}
              src={`/${buyExchange}.png`}
              alt="USDT"
              width={20}
              height={20}
            />
            <Typography>
              {toHumanString(vol24h.buyVol)}
            </Typography>
          </Box>
        ) : null}
        {sellExchange ? (
          <Box display="flex">
            <img
              style={{
                borderRadius: "50%",
              }}
              src={`/${sellExchange}.png`}
              alt="USDT"
              width={20}
              height={20}
            />
            <Typography>
              {toHumanString(vol24h.sellVol)}
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

export default Volume24h;
