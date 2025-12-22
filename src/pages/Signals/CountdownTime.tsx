import React, { useEffect, useState } from "react";
import {
  Typography,
} from "@mui/material";

const CountdownTimer: React.FC<{ targetTime: number }> = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) return "Settling...";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours}h ${mins}m ${secs}s`;
    };

    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    setTimeLeft(calculateTime()); // Initial call

    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <Typography
      variant="caption"
      sx={{ fontFamily: "monospace", color: "text.secondary" }}
    >
      {timeLeft}
    </Typography>
  );
};

export default CountdownTimer