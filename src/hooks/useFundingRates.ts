import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { PostitionsState } from "../redux/positions/positionsSlice";
import { getExchangeFundingRate } from "../services/funding";
import type { ExchangeName } from "../types/exchange";

const exchangesHasFundingRate: string[] = [
  "coinex",
  "bybit",
  "okx",
];

export const useFundingRates = () => {
  const positionsStore = useSelector((state: RootState) => state.positions);
  const [fundingRates, setFundingRates] = useState<
    Record<string, Record<string, { symbol: string; rate: number; interval: number | null }>>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFundingRates = async () => {
      setLoading(true);
      try {
        const fundingRateRequireds: { baseToken: string; exchange: string }[] = [];
        
        // Go through all positions in positionsStore to collect exchange and baseToken
        Object.keys(positionsStore).forEach((exchangeName) => {
          const exchangePositions = positionsStore[exchangeName as keyof PostitionsState];
          
          // Only fetch funding rates for exchanges that support it
          if (!exchangesHasFundingRate.includes(exchangeName)) {
            exchangePositions.forEach((position) => {
              fundingRateRequireds.push({
                baseToken: position.baseToken,
                exchange: exchangeName,
              });
            });
          }
        });

        // Remove duplicates based on exchange + baseToken combination
        const uniqueFundingRates = fundingRateRequireds.filter(
          (item, index, self) =>
            index === self.findIndex(
              (t) => t.exchange === item.exchange && t.baseToken === item.baseToken
            )
        );

        if (uniqueFundingRates.length > 0) {
          const data = await Promise.all(
            uniqueFundingRates.map(({ baseToken, exchange }) => {
              return getExchangeFundingRate(exchange as ExchangeName, baseToken).then(
                (fundingData) => ({
                  ...fundingData,
                  exchange,
                  baseToken,
                })
              );
            })
          );
          
          // Transform array to object structure: { exchange: { baseToken: fundingData } }
          const fundingRatesObject: Record<string, Record<string, { symbol: string; rate: number; interval: number | null }>> = {};
          
          data.forEach((item) => {
            if (!fundingRatesObject[item.exchange]) {
              fundingRatesObject[item.exchange] = {};
            }
            fundingRatesObject[item.exchange][item.baseToken] = {
              symbol: item.symbol,
              rate: item.rate,
              interval: item.interval,
            };
          });
          
          console.log({ fundingRatesObject });
          setFundingRates(fundingRatesObject);
        }
      } catch (error) {
        console.error("Error fetching funding rates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFundingRates();
  }, [positionsStore]);

  return { fundingRates, loading };
};
