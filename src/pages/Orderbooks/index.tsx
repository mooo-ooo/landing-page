import { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { ExchangeMap } from './constants'
import Orderbook from "./Orderbook";

const disablesExchanges = "disablesExchanges";
const cachedExchangeSettings: string[] = JSON.parse(
  localStorage.getItem(disablesExchanges) || "[]"
);

const firstId = new Date().getTime();
function OrderBook() {
  const [disablesExchangesSettings, setDisablesExchangesSettings] = useState(
    cachedExchangeSettings
  );
  const [ids, setIds] = useState<{ id: number; disabled?: boolean }[]>([
    { id: firstId },
  ]);
  const addOrderbook = () => {
    setIds((prev) => {
      return [...prev, { id: new Date().getTime() }];
    });
  };

  const removeOrderbook = (id: number) => {
    setIds((prev) => {
      return prev.map((ob) => {
        if (id === ob.id) {
          return {
            id,
            disabled: true,
          };
        }
        return ob;
      });
    });
  };

  useEffect(() => {
    localStorage.setItem(
      disablesExchanges,
      JSON.stringify(disablesExchangesSettings)
    );
  }, [disablesExchangesSettings]);

  const updateExchangeSettings = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = event.target;
    // if (disablesExchanges.includes(name))
    if (checked) {
      const newSettings = disablesExchangesSettings.includes(name)
        ? disablesExchangesSettings.filter((ex) => ex !== name)
        : disablesExchangesSettings;
      setDisablesExchangesSettings(newSettings);
    } else {
      const newSettings = disablesExchangesSettings.includes(name)
        ? disablesExchangesSettings
        : [...disablesExchangesSettings, name];
      setDisablesExchangesSettings(newSettings);
    }
  };
  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
        >
          <Typography>Exchange settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup sx={{ display: "flex", flexDirection: "row" }}>
            {Object.keys(ExchangeMap).map((name) => {
              const disabled = disablesExchangesSettings.includes(name);
              return (
                <FormControlLabel
                  color="info"
                  key={name}
                  name={name}
                  control={
                    <Checkbox
                      color="info"
                      onChange={updateExchangeSettings}
                      checked={!disabled}
                    />
                  }
                  label={name}
                />
              );
            })}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
      {ids.map(({ id, disabled }) =>
        !disabled ? (
          <Orderbook key={id} id={id} removeOrderbook={removeOrderbook} />
        ) : null
      )}
      <Box sx={{ position: "absolute", bottom: "-50px", right: "10px" }}>
        <IconButton size="large" onClick={addOrderbook} color="primary">
          <AddBoxIcon fontSize="large" />
        </IconButton>
      </Box>
    </Box>
  );
}

export default OrderBook;
