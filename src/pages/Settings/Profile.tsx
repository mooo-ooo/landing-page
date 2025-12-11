import { useState } from "react";
// import { AxiosError } from "axios";
// import api from "../../lib/axios";
import {
  Typography,
  Box,
  IconButton,
  Switch,
  FormControlLabel,
  Grid
} from "@mui/material";

import {
  ContentCopy,
} from "@mui/icons-material";
import { useSelector } from "react-redux";
import { selectGroup } from "../../redux/group/groupSlice";
import { selectUser } from "../../redux/user/userSlice";
import { enqueueSnackbar } from "notistack";



function Profile() {
  const user = useSelector(selectUser);
  const groupStore = useSelector(selectGroup);
  const [isAllowedSharePortfolio, setIsAllowedSharePortfolio] = useState<boolean>(groupStore.isAllowedSharePortfolio || false);

  return (
    <Box
      maxWidth="lg"
      display="flex"
      flexDirection="column"
      gap="12px"
      py="16px"
    >
      <Box sx={{ mb: 4 }} display="flex" flexDirection="row" gap="16px" justifyContent="space-between" alignItems="top">
        <Box display="flex" flexDirection="column" mb={2}>
          <Typography variant="h4" component="h1">
            Account overview
          </Typography>
          <Typography color="textSecondary">
            Manage your profile information
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              color="success"
              checked={isAllowedSharePortfolio}
              onChange={(e) => {
                setIsAllowedSharePortfolio(e.target.checked);
              }}
            />
          }
          label="Share portfolio"
        />
      </Box>

      <Grid container rowGap={2}>
        <Grid size={6}>
          <Typography color="text.secondary" >
            User ID
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography align="right">
            {user?.id}
          </Typography>
        </Grid>

        <Grid size={6}>
          <Typography color="text.secondary">
            Email
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography align="right">
            {user?.email}
          </Typography>
        </Grid>

        <Grid size={6}>
          <Typography color="text.secondary">
            Username
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography align="right">
            {user?.username || "N/A"}
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography color="text.secondary">
            Group Code
          </Typography>
        </Grid>
        <Grid size={6}>
          <Box display="flex" alignItems="center" justifyContent="flex-end" gap="8px">
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(user?.groupCode || "");
                enqueueSnackbar(`Copy ${user?.groupCode || ""}`, {
                  variant: "success",
                });
              }}
            >
              <ContentCopy />
            </IconButton>
            <Typography align="right">
              {user?.groupCode || "N/A"}
            </Typography>
          </Box>
          
        </Grid>

        <Grid size={6}>
          <Typography color="text.secondary">
            Group ID (for bot settings)
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography align="right">
            {user?.groupId}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile;
