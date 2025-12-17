import { type FC, Fragment, useState } from "react";
import {
  Step,
  StepButton,
  Paper,
  Stepper,
  Typography,
  Box,
  StepContent,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

const steps: string[] = [
  "Sign up and Setup Account",
  "Integrate & Connect API",
  "Start Funding Farming",
];

const stepContent: { title: string; desc: string }[] = [
  {
    title: "Security First",
    desc: "Register your account on crypto exchanges and enable all security measures. Crucially, enable cross-exchange deposit address whitelisting between the exchanges you want to connect. Simultaneously, register an account and enable 2FA on XAPY.io.",
  },
  {
    title: "API Connection",
    desc: "Create API keys (with appropriate permissions) on the crypto exchange and connect them to XAPY through the admin interface in XAPY.",
  },
  {
    title: "Deploy Strategy",
    desc: "Find a funding rate arbitrage strategy between two exchanges → initialize the strategy with appropriate slippage and bid settings → run the strategy and wait until the funding rate is credited to your account by the exchange.",
  },
];
const QuickStart: FC = () => {
  const isMobile = !useMediaQuery("(min-width:600px)");
  const [activeStep, setActiveStep] = useState(0);
  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  const Content = (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        background: "linear-gradient(180deg,#0f0f0fa6 10%,#242323)",
        borderRadius: 2,
        minHeight: "160px",
      }}
    >
      <Typography variant="h5" sx={{ color: "white", mb: 2, fontWeight: 600 }}>
        {stepContent[activeStep]?.title}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: "rgba(255, 255, 255, 0.7)",
          lineHeight: 1.7,
        }}
      >
        {stepContent[activeStep]?.desc}
      </Typography>
    </Paper>
  );

  return (
    <Fragment>
      <Stepper
        orientation={isMobile ? "vertical" : "horizontal"}
        sx={{
          "& .MuiStepIcon-root": {
            color: "grey.400", // Default color (inactive)
            "&.Mui-active": {
              color: "white", // Active color
            },
            fontSize: 32,
          },
        }}
        nonLinear
        activeStep={activeStep}
      >
        {steps.map((step, index) => (
          <Step key={step}>
            <StepButton color="inherit" onClick={handleStep(index)}>
              <Typography variant="h6" textAlign="center">
                {step}
              </Typography>
            </StepButton>
            {isMobile ? <StepContent>{Content}</StepContent> : null}
          </Step>
        ))}
      </Stepper>
      <Box height={16} />
      {isMobile ? null : Content}
    </Fragment>
  );
};

export default QuickStart;
