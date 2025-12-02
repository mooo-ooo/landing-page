import { useState, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import CoinIconLoader from "./CoinIconLoader";
import useMediaQuery from '@mui/material/useMediaQuery'
import Marquee from "react-fast-marquee";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useSelector } from "react-redux";
import readableNumber from "human-readable-numbers";
import {
  type IStrategy,
  selectStrategies,
} from "../redux/strategy/strategySlice";
import api from "../lib/axios";

// This component attempts to display the icon and calls onFallbackNeeded if it fails.
const StrategiesStatus = () => {
  const isWeb = useMediaQuery('(min-width:600px)')
  const initialized = useRef(false);
  const strategiesStore = useSelector(selectStrategies);
  const [strategies, setStrategies] = useState<IStrategy[]>();
  const fetchStrategies = () => {
    api
      .get("/api/v1/bot-master")
      .then(function ({ data }: { data: {name: string}[] }) {
        return setStrategies(
          data
            ?.map(({name}) => {
              const baseToken = name.split("-")[1]
              // 1. The result of .map() is (IStrategy | undefined)[]
              return strategiesStore.find(
                (strategy) => strategy.strategyName === baseToken
              );
            })
            .filter((i): i is IStrategy => Boolean(i))
            .filter(Boolean)
        );
      });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchStrategies();
    }, 1000 * 30);
    if (!initialized.current) {
      initialized.current = true;
      fetchStrategies();
    }
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!strategies?.length) {
    return null;
  }
  // Use the symbol as a key to force the <img> to re-attempt loading when the symbol changes
  return (
    <Box bgcolor="#1e2026" width="100%" py={1} display="flex">
      <Typography sx={{ whiteSpace: "nowrap" }} mx={1}>
        {isWeb ? "Bot running:" : <SmartToyIcon />}
      </Typography>
      <Marquee>
        {strategies.map(({isIncrease, strategyName, maxVolOfPosition, minVolOfPosition, bestInSpread, bestOutSpread}) => (
          <Box display="flex" gap={1} mr={4}>
            <CoinIconLoader
              height="20px"
              width="20px"
              symbol={strategyName.toLowerCase()}
            />
            <Typography >{strategyName}</Typography>
            <Typography>Vol:{readableNumber.toHumanString(isIncrease ? maxVolOfPosition * 2 : minVolOfPosition * 2)}</Typography>
            <Typography>Spread:{isIncrease ? bestInSpread : bestOutSpread}%</Typography>
          </Box>
        ))}
      </Marquee>
    </Box>
  );
};

export default StrategiesStatus;
