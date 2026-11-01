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
const DashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const PageTemp = lazy(() => import('../pages/PageTemp'));
const NotFoundPage = lazy(() => import('../pages/error/NotFound'));
const MenuManagementPage = lazy(() => import('../pages/MenuManagementPage'));
const MenuBrowsingPage = lazy(() => import('../pages/MenuBrowsingPage'));

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
