import { createElement, lazy } from 'react';

import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';

import { ROUTES } from './routeConstants';
import ProtectedRoute from './guards/ProtectedRoute';
import MenuAdminRoute from './guards/MenuAdminRoute';

const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const RestaurantsPage = lazy(() => import('../pages/RestaurantsPage'));
const RestaurantDetailPage = lazy(() => import('../pages/RestaurantDetailPage'));
const ReservationPage = lazy(() => import('../pages/ReservationPage'));
const ReservationVipPage = lazy(() => import('../pages/ReservationVipPage'));
const MyReservationPage = lazy(() => import('../pages/MyReservationPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const DashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const VipRoomAnalyticsPage = lazy(() => import('../pages/VipRoomAnalyticsPage'));
const KitchenPerformanceAnalyticsPage = lazy(() => import('../pages/KitchenPerformanceAnalyticsPage'));
const TableAreaManagementPage = lazy(() => import('../pages/TableAreaManagementPage'));
const TableManagementPage = lazy(() => import('../pages/TableManagementPage'));
const TableStatusTrackingPage = lazy(() => import('../pages/TableStatusTrackingPage'));
const KitchenQueueTrackingPage = lazy(() => import('../pages/KitchenQueueTrackingPage'));
const VipRoomManagementPage = lazy(() => import('../pages/VipRoomManagementPage'));
const PaymentReturnPage = lazy(() => import('../pages/PaymentReturnPage'));
const PageTemp = lazy(() => import('../pages/PageTemp'));
const NotFoundPage = lazy(() => import('../pages/error/NotFound'));
const MenuManagementPage = lazy(() => import('../pages/MenuManagementPage'));
const MenuBrowsingPage = lazy(() => import('../pages/MenuBrowsingPage'));
const RoleManagementPage = lazy(() => import('../pages/RoleManagementPage'));
const StaffManagementPage = lazy(() => import('../pages/StaffManagementPage'));
const TablePlanningPage = lazy(() => import('../pages/TablePlanningPage'));

export const routeConfig = [
    {
        element: createElement(AuthLayout),
        children: [
            { path: ROUTES.MENUS, element: createElement(MenuBrowsingPage) },
            { path: ROUTES.MENU_DETAIL, element: createElement(MenuBrowsingPage) },
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
                path: ROUTES.RESERVATION_NEW,
                element: createElement(ReservationPage),
            },
            {
                path: ROUTES.RESTAURANT_DETAIL,
                element: createElement(RestaurantDetailPage),
            },
            {
                path: ROUTES.PAYMENT_RETURN,
                element: createElement(PaymentReturnPage),
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
                path: ROUTES.PROFILE,
                element: createElement(ProfilePage),
            },
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
            {
                path: ROUTES.TABLE_RECOMMENDATIONS,
                element: createElement(TablePlanningPage, { key: 'customer-allocation', customer: true }),
            },
            {
                path: ROUTES.TABLE_COMBINATIONS,
                element: createElement(TablePlanningPage, { key: 'customer-combinations', module: 'combination', customer: true }),
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
                path: ROUTES.TABLE_ALLOCATION,
                element: createElement(TablePlanningPage, { key: 'staff-allocation' }),
            },
            {
                path: ROUTES.MULTI_TABLE_COMBINATION,
                element: createElement(TablePlanningPage, { key: 'staff-combinations', module: 'combination' }),
            },
            {
                path: ROUTES.KITCHEN_QUEUE,
                element: createElement(KitchenQueueTrackingPage),
            },
            {
                path: ROUTES.VIP_ROOMS,
                element: createElement(VipRoomManagementPage),
            },
            {
                path: ROUTES.DASHBOARD_TABLES,
                element: createElement(DashboardPage),
            },
            {
                path: ROUTES.DASHBOARD_VIP_ROOMS,
                element: createElement(VipRoomAnalyticsPage),
            },
            {
                path: ROUTES.DASHBOARD_KITCHEN,
                element: createElement(KitchenPerformanceAnalyticsPage),
            },
            {
                path: ROUTES.ROLE_MANAGEMENT,
                element: createElement(RoleManagementPage),
            },
            {
                path: ROUTES.STAFF_MANAGEMENT,
                element: createElement(StaffManagementPage),
            },
        ],
    },

    {
        element: createElement(MenuAdminRoute, null, createElement(AdminLayout)),
        children: [
            { path: ROUTES.MENU_CATEGORIES, element: createElement(MenuManagementPage, { key: 'categories', kind: 'category' }) },
            { path: ROUTES.MENU_ITEMS, element: createElement(MenuManagementPage, { key: 'items', kind: 'item' }) },
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
