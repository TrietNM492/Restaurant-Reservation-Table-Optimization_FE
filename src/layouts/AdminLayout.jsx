import { Outlet } from "react-router-dom";

import {
    Box,
    Typography,
} from "@mui/material";

function AdminLayout() {
    return (
        <Box>
            <Typography variant="h5">
                Header
            </Typography>

            <hr />

            <Outlet />
        </Box>
    );
}

export default AdminLayout;