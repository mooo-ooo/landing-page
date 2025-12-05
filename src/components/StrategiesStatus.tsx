import { useState, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import CoinIconLoader from "./CoinIconLoader";
import useMediaQuery from "@mui/material/useMediaQuery";
import Marquee from "react-fast-marquee";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useSelector } from "react-redux";
import readableNumber from "human-readable-numbers";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { removeHeadSegment } from "../helpers";
import {
  type IStrategy,
  selectStrategies,
} from "../redux/strategy/strategySlice";
import { selectGroup } from "../redux/group/groupSlice";
import api from "../lib/axios";

// This component attempts to display the icon and calls onFallbackNeeded if it fails.
const StrategiesStatus = () => {
  const groupStore = useSelector(selectGroup);
  const isWeb = useMediaQuery("(min-width:600px)");
  const initialized = useRef(false);
  const strategiesStore = useSelector(selectStrategies);
  const [strategies, setStrategies] = useState<IStrategy[]>();
  const fetchBotMaster = () => {
    api
      .get("/api/v1/bot-master")
      .then(function ({ data }: { data: { name: string }[] }) {
        return setStrategies(
          data
            ?.map(({ name }) => {
              const strategyName = removeHeadSegment(name);
              // 1. The result of .map() is (IStrategy | undefined)[]
              return strategiesStore.find(
                (strategy) => strategy.strategyName === strategyName
              );
            })
            .filter((i): i is IStrategy => Boolean(i))
            .filter(Boolean)
        );
      });
  };

  useEffect(() => {
    if (groupStore.botMasterBaseUrl) {
      const intervalId = setInterval(() => {
        fetchBotMaster();
      }, 1000 * 30);
      if (!initialized.current) {
        initialized.current = true;
        fetchBotMaster();
      }
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupStore.botMasterBaseUrl]);

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
        {strategies.map(
          ({
            isIncrease,
            strategyName,
            maxVolOfPosition,
            minVolOfPosition,
            bestInSpread,
            bestOutSpread,
          }) => (
            <Box display="flex" gap={1} mr={4}>
              <CoinIconLoader
                height="20px"
                width="20px"
                symbol={strategyName.toLowerCase()}
              />
              <Typography>{strategyName}</Typography>
              <Typography>
                Vol:
                {readableNumber.toHumanString(
                  isIncrease ? maxVolOfPosition * 2 : minVolOfPosition * 2
                )}
              </Typography>
              <Typography>
                Spread:{isIncrease ? bestInSpread : bestOutSpread}%
              </Typography>
              {isIncrease ? (
                <TrendingUpIcon sx={{ color: "rgb(14, 203, 129)" }} />
              ) : (
                <TrendingDownIcon sx={{ color: "rgb(246, 70, 93)" }} />
              )}
            </Box>
          )
        )}
      </Marquee>
    </Box>
  );
};

export default StrategiesStatus;
