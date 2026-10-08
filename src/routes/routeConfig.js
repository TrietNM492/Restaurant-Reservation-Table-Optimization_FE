import { createElement, lazy } from "react";

import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";

import { ROUTES } from "./routeConstants";
import ProtectedRoute from "./guards/ProtectedRoute";

const LoginPage = lazy(() =>
    import("../pages/LoginPage")
);

const DashboardPage = lazy(() =>
    import("../pages/AdminDashboardPage")
);

const PageTemp = lazy(() =>
    import("../pages/PageTemp")
);

const NotFoundPage = lazy(() =>
    import("../pages/error/NotFound")
);

export const routeConfig = [
    {
        element: createElement(AuthLayout),
        children: [
            {
                path: ROUTES.LOGIN,
                element: createElement(LoginPage),
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
                element: createElement(DashboardPage)
            }
        ]
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