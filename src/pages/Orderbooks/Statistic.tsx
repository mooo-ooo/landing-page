import { Box, Paper, Grid, Typography } from "@mui/material";
import { type IStatistic } from "./FundingHistory/Container";
import { red, green } from "../../constants/colors";

function Statistic({ data }: { data: IStatistic[] }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        borderStyle: "dashed",
        mb: 2,
      }}
    >
      {/* --- SUMMARY HEADER SECTION --- */}
      <Box sx={{ mb: 1 }}>
        <Typography mb={2} component="h6" variant="h6" fontWeight="600">
          Best performance over the recent period
        </Typography>
        <Grid container spacing={2}>
          <Grid size={4}>
            <Typography
              variant="caption"
              color="gray"
              sx={{ fontWeight: "bold" }}
            >
              Period
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography
              variant="caption"
              color="gray"
              sx={{ fontWeight: "bold" }}
            >
              Apr
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography
              variant="caption"
              color="gray"
              sx={{ fontWeight: "bold" }}
            >
              Exchanges
            </Typography>
          </Grid>
        </Grid>

        {data.map((row, index) => (
          <Grid container spacing={2} key={index} sx={{ mt: 1 }}>
            <Grid size={4}>
              <Typography
                variant="body2"
                color="white"
                sx={{ display: "inline-flex" }}
              >
                <span>{row.label}</span>{" "}
                <span>({row.accumulated.toFixed(3)}%)</span>
              </Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="body2" color="white">
                {row.apr.toFixed(3)}%
              </Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="body2" sx={{ display: "inline-flex" }}>
                <span style={{ color: red }}>{row.sellEx}</span>
                <span style={{ color: "gray" }}> / </span>
                <span style={{ color: green }}>{row.buyEx}</span>
              </Typography>
            </Grid>
          </Grid>
        ))}
      </Box>
    </Paper>
  );
}

export default Statistic;
