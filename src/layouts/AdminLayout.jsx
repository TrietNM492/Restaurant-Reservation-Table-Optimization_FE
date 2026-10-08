import { useState } from 'react';
import { Outlet } from "react-router-dom";
import Box from '@mui/material/Box';
import Breadcrumb from '../components/common/Breadcrumb';
import Footer from '../components/common/Footer';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';

function AdminLayout() {
    const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

    return (
        <Box className="admin-shell">
            <Sidebar
                mobileOpen={mobileNavigationOpen}
                onMobileClose={() => setMobileNavigationOpen(false)}
            />
            <Box className="admin-shell__main">
                <Header onMenuClick={() => setMobileNavigationOpen(true)} />
                <Box className="admin-shell__breadcrumb"><Breadcrumb /></Box>
                <Box component="main" className="admin-shell__content">
                    <Outlet />
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}

export default AdminLayout;