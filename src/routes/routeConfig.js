import { createElement, lazy } from 'react';

import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';

import { ROUTES } from './routeConstants';
import ProtectedRoute from './guards/ProtectedRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const RestaurantsPage = lazy(() => import('../pages/RestaurantsPage'));
const RestaurantDetailPage = lazy(() => import('../pages/RestaurantDetailPage'));
const ReservationPage = lazy(() => import('../pages/ReservationPage'));
const ReservationVipPage = lazy(() => import('../pages/ReservationVipPage'));
const MyReservationPage = lazy(() => import('../pages/MyReservationPage'));
const DashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const TableAreaManagementPage = lazy(() => import('../pages/TableAreaManagementPage'));
const TableManagementPage = lazy(() => import('../pages/TableManagementPage'));
const TableStatusTrackingPage = lazy(() => import('../pages/TableStatusTrackingPage'));
const VipRoomManagementPage = lazy(() => import('../pages/VipRoomManagementPage'));
const PageTemp = lazy(() => import('../pages/PageTemp'));
const NotFoundPage = lazy(() => import('../pages/error/NotFound'));

export const routeConfig = [
    {
        element: createElement(AuthLayout),
        children: [
            {
                path: ROUTES.HOME,
                element: createElement(HomePage),
            },
            {
                path: ROUTES.LOGIN,
                element: createElement(LoginPage),
            },
            {
                path: ROUTES.REGISTER,
                element: createElement(RegisterPage),
            },
            {
                path: ROUTES.RESTAURANTS,
                element: createElement(RestaurantsPage),
            },
            {
                path: ROUTES.RESTAURANT_DETAIL,
                element: createElement(RestaurantDetailPage),
            },
            {
                path: ROUTES.RESERVATION_NEW,
                element: createElement(ReservationPage),
            },
        ],
    },

    {
        element: createElement(
            ProtectedRoute,
            null,
            createElement(AuthLayout)
        ),
        children: [
            {
                path: ROUTES.RESERVATIONS_ME,
                element: createElement(MyReservationPage),
            },
            {
                path: ROUTES.RESERVATION_EDIT,
                element: createElement(ReservationPage),
            },
            {
                path: ROUTES.RESERVATION_VIP,
                element: createElement(ReservationVipPage),
            },
        ],
    },

    {
        element: createElement(
            ProtectedRoute,
            null,
            createElement(AdminLayout)
        ),
        children: [
            {
                path: ROUTES.DASHBOARD,
                element: createElement(DashboardPage),
            },
            {
                path: ROUTES.TABLE_AREAS,
                element: createElement(TableAreaManagementPage),
            },
            {
                path: ROUTES.TABLES,
                element: createElement(TableManagementPage),
            },
            {
                path: ROUTES.TABLE_TRACKING,
                element: createElement(TableStatusTrackingPage),
            },
            {
                path: ROUTES.VIP_ROOMS,
                element: createElement(VipRoomManagementPage),
            },
        ],
    },

    {
        path: ROUTES.PAGE_TEMP,
        element: createElement(PageTemp),
    },

    {
        path: ROUTES.NOT_FOUND,
        element: createElement(NotFoundPage),
    },
];
