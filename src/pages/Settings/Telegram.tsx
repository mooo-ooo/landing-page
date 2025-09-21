import { useState } from "react";
import { AxiosError } from "axios";
import api from "../../lib/axios";
import SaveIcon from "@mui/icons-material/Save";
import type { AppDispatch } from "../../redux/store";
import { TextField, Button, Typography, Alert, Box } from "@mui/material";
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
      await api.put(`/api/v1/groups/me`, formData);
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

      <Box sx={{ mb: 4 }}>
        <Typography mb={2} color="textSecondary">
          This group provides important announcements that require immediate
          action to protect your positions and capital, such as withdrawing
          funds, receiving money, or balancing your position's volume, etc.
        </Typography>
        <TextField
          fullWidth
          label="Important group token"
          name="telePriorityToken"
          value={formData.telePriorityToken}
          onChange={handleChange}
          InputProps={{
            autoComplete: "off",
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Important bot id"
          name="telePriorityId"
          value={formData.telePriorityId}
          onChange={handleChange}
          InputProps={{
            autoComplete: "off",
          }}
          sx={{ mb: 2 }}
        />
        <Box height={16} />
        <Typography mb={2} color="textSecondary">
          This group provides notifications about order spread rates, good deals
          available on the market, and your current leverage.
        </Typography>
        <TextField
          fullWidth
          label="Log group token"
          name="teleLogToken"
          value={formData.teleLogToken}
          onChange={handleChange}
          InputProps={{
            autoComplete: "off",
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Log bot id"
          name="teleLogId"
          value={formData.teleLogId}
          onChange={handleChange}
          InputProps={{
            autoComplete: "off",
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="2FA Token"
          name="token"
          value={formData.token}
          onChange={handleChange}
          InputProps={{
            autoComplete: "off",
          }}
          sx={{ mb: 2 }}
        />
        <Box display="flex" width="100%" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isLoading}
            onClick={handleUpdate}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Telegram;
