import { useState } from "react";
import { AxiosError } from "axios";
import api from "../../lib/axios";
import SaveIcon from "@mui/icons-material/Save";
import type { AppDispatch } from "../../redux/store";
import {
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  AlertTitle,
} from "@mui/material";
import { selectGroup, fetchGroup } from "../../redux/group/groupSlice";
import { useDispatch, useSelector } from "react-redux";
import { pick } from "lodash";

function Telegram() {
  const dispatch = useDispatch<AppDispatch>();
  const groupStore = useSelector(selectGroup);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ...pick(groupStore, [
      "telePriorityToken",
      "teleLogToken",
      "telePriorityId",
      "teleLogId",
    ]),
    token: "",
  });

  const handleUpdate = async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      await api.put(`/api/v1/groups/me`, { ...formData, type: "telegram" });
      dispatch(fetchGroup());
      setSuccess("settings updated successfully");
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Failed to save API keys");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
      setFormData((prev) => ({
        ...prev,
        token: "",
      }));
    }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: unknown } }
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box display="flex" flexDirection="column" gap="12px" py="16px">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Telegram settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Stay updated on important information by using Telegram.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box display="flex" flexDirection="row" gap="24px">
        <Box>
          <Box mb={2}>
            <Typography>
              This group provides important announcements that require immediate
              action to protect your positions and capital
            </Typography>
          </Box>

          <Typography color="textSecondary">Important group token</Typography>
          <TextField
            fullWidth
            size="small"
            name="telePriorityToken"
            value={formData.telePriorityToken}
            onChange={handleChange}
            InputProps={{
              autoComplete: "off",
            }}
            sx={{ mb: 4 }}
          />

          <Typography color="textSecondary">Important bot id</Typography>
          <TextField
            size="small"
            fullWidth
            name="telePriorityId"
            value={formData.telePriorityId}
            onChange={handleChange}
            InputProps={{
              autoComplete: "off",
            }}
            sx={{ mb: 4 }}
          />
          <Alert severity="info">
            <AlertTitle>Actions</AlertTitle>
            <Box>
              <Typography fontStyle="italic" color="textSecondary">
                - Withdrawing assets
              </Typography>
              <Typography fontStyle="italic" color="textSecondary">
                - Receiving assets
              </Typography>
              <Typography fontStyle="italic" color="textSecondary">
                - Updating api keys
              </Typography>
            </Box>
          </Alert>
        </Box>

        <Box
          sx={{ borderLeft: "1px solid rgba(255, 255, 255, 0.12)" }}
          paddingLeft="24px"
        >
          <Typography mb={2}>
            This group provides notifications about order spread rates, good
            deals available on the market, and your current leverage.
          </Typography>

          <Typography color="textSecondary">Log group token</Typography>
          <TextField
            size="small"
            fullWidth
            name="teleLogToken"
            value={formData.teleLogToken}
            onChange={handleChange}
            InputProps={{
              autoComplete: "off",
            }}
            sx={{ mb: 4 }}
          />

          <Typography color="textSecondary">Log bot id</Typography>
          <TextField
            size="small"
            fullWidth
            name="teleLogId"
            value={formData.teleLogId}
            onChange={handleChange}
            InputProps={{
              autoComplete: "off",
            }}
            sx={{ mb: 4 }}
          />

          <Alert severity="info">
            <AlertTitle>Actions</AlertTitle>
            <Box>
              <Typography fontStyle="italic" color="textSecondary">
                - Exchange leverage (cross)
              </Typography>
              <Typography fontStyle="italic" color="textSecondary">
                - Open/close spread
              </Typography>
              <Typography fontStyle="italic" color="textSecondary">
                - Positions / Equites
              </Typography>
            </Box>
          </Alert>
        </Box>
      </Box>
      <Box
        borderTop="1px solid rgba(255, 255, 255, 0.12)"
        paddingTop="24px"
        display="flex"
        width="100%"
        justifyContent="flex-end"
        alignItems="center"
        mt={1}
      >
        <Box
          display="flex"
          width="100%"
          justifyContent={"space-between"}
          sx={{ width: "50%" }}
        >
          <TextField
            size="small"
            label="2FA Token"
            name="token"
            sx={{ width: "250px" }}
            value={formData.token}
            onChange={handleChange}
            InputProps={{
              autoComplete: "off",
            }}
          />
          <Box display="flex" alignItems="flex-end">
            <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isLoading || formData.token.length !== 6}
            onClick={handleUpdate}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
          </Box>
          
        </Box>
      </Box>
    </Box>
  );
}

export default Telegram;
